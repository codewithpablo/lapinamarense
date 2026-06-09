import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission, SAFE_METHODS
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models.functions import TruncDate
from django.db.models import Sum
from datetime import timedelta
from django.utils import timezone
from .models import User, Category, Product, Cart, CartItem, Order, OrderItem, Combo, ComboItem, PaymentCard, Employee, Supplier
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, CreateOrderSerializer,
    CustomTokenObtainPairSerializer, PresencialSaleSerializer,
    ComboSerializer, ComboItemSerializer, PaymentCardSerializer,
    EmployeeSerializer, SupplierSerializer,
)

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.views import APIView


def is_staff(user):
    return user.is_authenticated and user.role in ('superadmin', 'admin', 'empleado')

def is_manager(user):
    return user.is_authenticated and user.role in ('superadmin', 'admin')


class IsStaffOrReadOnly(BasePermission):
    """Lecturas públicas (GET/HEAD/OPTIONS); escrituras solo para staff."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_staff(request.user)


class IsStaff(BasePermission):
    """Acceso solo para staff (superadmin/admin/empleado) en cualquier método."""
    def has_permission(self, request, view):
        return is_staff(request.user)


class GoogleAuthView(APIView):
    """Login/registro con Google. Recibe el access token de Google, lo valida
    contra Google (tokeninfo: que sea válido y emitido para NUESTRO Client ID),
    y busca o crea el usuario por email/sub. Devuelve JWT igual que el login normal."""
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Falta el token de Google'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({'error': 'El login con Google no está configurado en el servidor'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # 1) Validar el access token con Google. tokeninfo confirma que el token es
        #    válido y devuelve 'aud' = el Client ID al que fue emitido. Exigimos que
        #    sea el NUESTRO, evitando que sirva un token emitido para otra app.
        try:
            ti = requests.get('https://oauth2.googleapis.com/tokeninfo',
                              params={'access_token': access_token}, timeout=6)
        except requests.RequestException:
            return Response({'error': 'No se pudo validar con Google'}, status=status.HTTP_502_BAD_GATEWAY)
        if ti.status_code != 200:
            return Response({'error': 'Token de Google inválido'}, status=status.HTTP_401_UNAUTHORIZED)
        info = ti.json()

        if info.get('aud') != settings.GOOGLE_CLIENT_ID:
            return Response({'error': 'Token de Google inválido'}, status=status.HTTP_401_UNAUTHORIZED)
        if str(info.get('email_verified')).lower() != 'true':
            return Response({'error': 'El email de Google no está verificado'},
                            status=status.HTTP_401_UNAUTHORIZED)
        email = info.get('email')
        if not email:
            return Response({'error': 'Google no devolvió un email'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) Nombre (best-effort) desde userinfo
        try:
            ui = requests.get('https://www.googleapis.com/oauth2/v3/userinfo',
                              headers={'Authorization': f'Bearer {access_token}'}, timeout=6)
            profile = ui.json() if ui.status_code == 200 else {}
        except requests.RequestException:
            profile = {}

        google_sub = info.get('sub') or profile.get('sub')
        user = None
        if google_sub:
            user = User.objects.filter(google_sub=google_sub).first()
        if user is None:
            user = User.objects.filter(email__iexact=email).first()

        if user is None:
            # Cuenta nueva creada con Google
            user = User(
                username=self._unique_username(email),
                email=email,
                first_name=profile.get('given_name', ''),
                last_name=profile.get('family_name', ''),
                role='cliente',
                google_sub=google_sub,
            )
            user.set_unusable_password()
            user.save()
        elif google_sub and not user.google_sub:
            # Primera vez que una cuenta existente (encontrada por email) entra con Google: la vinculamos
            user.google_sub = google_sub
            user.save(update_fields=['google_sub'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data,
        })

    @staticmethod
    def _unique_username(email):
        base = (email.split('@')[0] or 'user')[:140]
        username = base
        i = 1
        while User.objects.filter(username=username).exists():
            i += 1
            username = f'{base}{i}'
        return username


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_manager(request.user):
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.filter(role='cliente', is_active=True).values(
            'id', 'username', 'first_name', 'last_name', 'email', 'phone', 'role'
        )
        return Response(list(users))


class UserRoleView(APIView):
    """Superadmin: listar todos los usuarios y cambiar roles."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'superadmin':
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.exclude(pk=request.user.pk).values(
            'id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active'
        )
        return Response(list(users))

    def patch(self, request, pk=None):
        if request.user.role != 'superadmin':
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        new_role = request.data.get('role')
        if new_role not in ('superadmin', 'admin', 'empleado', 'cliente'):
            return Response({'error': 'Rol inválido'}, status=status.HTTP_400_BAD_REQUEST)
        target.role = new_role
        target.save()
        return Response({'id': target.pk, 'role': target.role})


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        user = request.user
        allowed = {'first_name', 'last_name', 'email', 'phone', 'address'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            user.save(update_fields=['avatar'])
        if data:
            serializer = UserSerializer(user, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(user, context={'request': request}).data)

    def put(self, request):
        # Cambio de contraseña
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'Se requieren old_password y new_password'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(old_password):
            return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({'ok': True})


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]

    def list(self, request, *args, **kwargs):
        # ?flat=1 returns all categories (for admin); default returns tree
        if request.query_params.get('flat'):
            return super().list(request, *args, **kwargs)
        queryset = Category.objects.filter(parent=None).prefetch_related('children')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            try:
                cat = Category.objects.get(id=category_id)
                child_ids = list(cat.children.values_list('id', flat=True))
                if child_ids:
                    queryset = queryset.filter(category_id__in=child_ids)
                else:
                    queryset = queryset.filter(category_id=category_id)
            except Category.DoesNotExist:
                pass
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class ComboViewSet(viewsets.ModelViewSet):
    queryset = Combo.objects.filter(is_active=True).prefetch_related('items__product')
    serializer_class = ComboSerializer
    permission_classes = [IsStaffOrReadOnly]

    @action(detail=True, methods=['post', 'delete'])
    def item(self, request, pk=None):
        combo = self.get_object()
        if request.method == 'POST':
            product_id = request.data.get('product_id')
            quantity   = request.data.get('quantity', 1)
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({'error': 'Producto no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
            ci, _ = ComboItem.objects.update_or_create(
                combo=combo, product=product,
                defaults={'quantity': quantity}
            )
            return Response(ComboItemSerializer(ci).data)
        else:
            product_id = request.data.get('product_id')
            ComboItem.objects.filter(combo=combo, product_id=product_id).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsStaff]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsStaff]


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def get_object(self):
        try:
            cart, created = Cart.objects.get_or_create(user=self.request.user)
            return cart
        except Exception as e:
            logger.error(f"Error getting/creating cart for user {self.request.user}: {e}")
            raise e

    def list(self, request):
        cart = self.get_object()
        serializer = self.serializer_class(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        product = get_object_or_404(Product, id=product_id, is_active=True)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartItemSerializer(cart_item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['put', 'patch'])
    def update_item(self, request):
        cart = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        cart_item.quantity = quantity
        cart_item.save()

        serializer = CartItemSerializer(cart_item, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        cart = self.get_object()
        product_id = request.data.get('product_id')

        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        cart_item.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        cart = self.get_object()
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if is_staff(self.request.user):
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def sales_data(self, request):
        if not is_staff(request.user):
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        data = Order.objects.filter(created_at__gte=start_date).annotate(date=TruncDate('created_at')).values('date').annotate(total=Sum('total_amount')).order_by('date')
        return Response(data)

    def create(self, request):
        cart = get_object_or_404(Cart, user=request.user)
        if not cart.items.exists():
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreateOrderSerializer(data=request.data)
        if serializer.is_valid():
            order = Order.objects.create(
                user=request.user,
                total_amount=cart.total_price(),
                delivery_address=serializer.validated_data['delivery_address'],
                phone=serializer.validated_data['phone'],
                notes=serializer.validated_data.get('notes', '')
            )

            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price
                )

            cart.items.all().delete()

            order_serializer = OrderSerializer(order, context={'request': request})
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def presencial(self, request):
        if not is_staff(request.user):
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PresencialSaleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Resolve customer
        if data.get('customer_id'):
            try:
                customer = User.objects.get(id=data['customer_id'])
            except User.DoesNotExist:
                return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            customer, _ = User.objects.get_or_create(
                username='anonimo',
                defaults=dict(first_name='Cliente', last_name='Anónimo', email='anonimo@pinamarense.com')
            )

        # Validate products and compute total
        total = 0
        line_items = []
        for item in data['items']:
            try:
                product = Product.objects.get(id=item['product_id'], is_active=True)
            except Product.DoesNotExist:
                return Response({'error': f'Producto {item["product_id"]} no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
            if product.stock < item['quantity']:
                return Response({'error': f'Stock insuficiente para {product.name}'}, status=status.HTTP_400_BAD_REQUEST)
            total += product.price * item['quantity']
            line_items.append((product, item['quantity']))

        order = Order.objects.create(
            user=customer,
            status='delivered',
            source='presencial',
            total_amount=total,
            delivery_address='Venta en local',
            phone=customer.phone or '—',
            notes=data.get('notes', ''),
        )

        for product, quantity in line_items:
            OrderItem.objects.create(order=order, product=product, quantity=quantity, price=product.price)
            product.stock -= quantity
            product.save()

        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):

        if not is_staff(request.user):
            return Response(
                {'error': 'No tienes permiso para realizar esta acción'},
                status=status.HTTP_403_FORBIDDEN
            )

        order = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()

        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)


class PaymentCardViewSet(viewsets.ModelViewSet):
    serializer_class   = PaymentCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentCard.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'])
    def set_default(self, request, pk=None):
        card = self.get_object()
        card.is_default = True
        card.save()
        return Response(PaymentCardSerializer(card).data)

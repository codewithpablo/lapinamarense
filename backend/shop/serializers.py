from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Category, Product, Cart, CartItem, Order, OrderItem, Combo, ComboItem, PaymentCard, Employee, Supplier, Branch


class UserSerializer(serializers.ModelSerializer):
    password       = serializers.CharField(write_only=True, required=True)
    email          = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message='Ese email ya está registrado')],
    )
    is_store_owner = serializers.BooleanField(read_only=True)
    role           = serializers.CharField(read_only=True)
    avatar         = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        if obj.avatar:
            return obj.avatar.url
        return None

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name',
                  'phone', 'address', 'is_store_owner', 'role', 'avatar']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = True
        user.save()
        return user


class CategoryChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image_url', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    children = CategoryChildSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image_url', 'parent', 'children', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name  = serializers.CharField(source='category.name', read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'net_content', 'price', 'discount_price', 'offer_tag',
                  'effective_price', 'category', 'category_name', 'image', 'stock',
                  'is_active', 'created_at', 'updated_at']


class ComboItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ComboItem
        fields = ['id', 'product', 'product_id', 'quantity']


class ComboSerializer(serializers.ModelSerializer):
    items = ComboItemSerializer(many=True, read_only=True)

    class Meta:
        model = Combo
        fields = ['id', 'name', 'description', 'price', 'image', 'is_active', 'items', 'created_at']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Producto no encontrado o no disponible")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    payment_method_display  = serializers.CharField(source='get_payment_method_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'source', 'payment_method', 'payment_method_display',
                  'delivery_method', 'delivery_method_display', 'guest_name',
                  'total_amount', 'delivery_address', 'phone', 'notes', 'items', 'created_at', 'updated_at']


class GuestOrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity   = serializers.IntegerField(min_value=1)


class GuestOrderSerializer(serializers.Serializer):
    """Pedido de un cliente SIN cuenta (invitado). Trae sus datos de contacto."""
    items           = GuestOrderItemSerializer(many=True)
    name            = serializers.CharField(max_length=120)
    phone           = serializers.CharField(max_length=20)
    payment_method  = serializers.ChoiceField(choices=['efectivo', 'transferencia'])
    delivery_method = serializers.ChoiceField(choices=['envio', 'retiro'])
    delivery_address = serializers.CharField(required=False, allow_blank=True, default='')
    notes           = serializers.CharField(required=False, allow_blank=True, default='')


class PresencialSaleItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity   = serializers.IntegerField(min_value=1)


class PresencialSaleSerializer(serializers.Serializer):
    items      = PresencialSaleItemSerializer(many=True)
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    notes      = serializers.CharField(required=False, allow_blank=True, default='')


class CreateOrderSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method  = serializers.ChoiceField(choices=['efectivo', 'transferencia'], required=False, default='efectivo')
    delivery_method = serializers.ChoiceField(choices=['envio', 'retiro'], required=False, default='envio')


class PaymentCardSerializer(serializers.ModelSerializer):
    brand_display     = serializers.CharField(source='get_brand_display', read_only=True)
    card_type_display = serializers.CharField(source='get_card_type_display', read_only=True)

    class Meta:
        model  = PaymentCard
        fields = ['id', 'cardholder_name', 'last_four', 'brand', 'brand_display',
                  'card_type', 'card_type_display', 'available_balance', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'name', 'role', 'phone', 'shift', 'active']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact', 'phone', 'email', 'categories', 'active']


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'slug', 'address', 'phone', 'is_active', 'is_default']

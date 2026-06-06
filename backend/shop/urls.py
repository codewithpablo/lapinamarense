from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, UserListView, UserProfileView,
    UserRoleView,
    CategoryViewSet, ProductViewSet, ComboViewSet, CartViewSet, OrderViewSet,
    PaymentCardViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'combos', ComboViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'cards', PaymentCardViewSet, basename='card')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view({'post': 'create'}), name='register'),
    path('auth/users/', UserListView.as_view(), name='user-list'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/roles/', UserRoleView.as_view(), name='user-roles'),
    path('auth/roles/<int:pk>/', UserRoleView.as_view(), name='user-role-update'),
    path('', include(router.urls)),
]

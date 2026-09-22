from django.urls import path

from . import views

urlpatterns = [
    # Users
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path(
        "auth/login/",
        views.CookieTokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "auth/refresh/",
        views.CookieTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    # Accounts
    path("accounts/", views.AccountsList.as_view(), name="accounts-view"),
    path("accounts/create", views.AccountCreate.as_view(), name="account-create-view"),
    path(
        "accounts/<int:pk>",
        views.AccountDetail.as_view(),
        name="account-retrieve-update-destroy-view",
    ),
    # Categories
    path("categories/", views.CategoriesList.as_view(), name="categories-view"),
    # Subcategories
    path(
        "subcategories/",
        views.SubcategoriesList.as_view(),
        name="subcategories-view",
    ),
    # Transactions
    path(
        "transactions/",
        views.TransactionsList.as_view(),
        name="transactions-view",
    ),
    path(
        "transactions/create",
        views.TransactionCreate.as_view(),
        name="transaction-create-view",
    ),
    path(
        "transactions/<int:pk>",
        views.TransactionDetail.as_view(),
        name="transaction-retrieve-update-destroy-view",
    ),
    path("feedback/", views.FeedbackView.as_view(), name="feedback-view"),
    # Settings
    path(
        "settings/",
        views.UserSettingsView.as_view(),
        name="user-settings-view",
    ),
    path(
        "settings/categories/",
        views.UserCategoryPreferencesView.as_view(),
        name="user-category-preferences-view",
    ),
    path(
        "settings/categories/<int:pk>/",
        views.UserCategoryPreferenceDetail.as_view(),
        name="user-category-preference-detail",
    ),
    path(
        "settings/subcategories/",
        views.UserSubcategoryPreferencesView.as_view(),
        name="user-subcategory-preferences-view",
    ),
    path(
        "settings/subcategories/<int:pk>/",
        views.UserSubcategoryPreferenceDetail.as_view(),
        name="user-subcategory-preference-detail",
    ),
]

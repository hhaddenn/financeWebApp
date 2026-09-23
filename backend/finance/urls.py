from django.urls import path

from . import views

urlpatterns = [
    # Users
    path("auth/csrf/", views.CsrfTokenView.as_view(), name="csrf-token"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path(
        "auth/verify-email/<str:uid>/<str:token>/",
        views.VerifyEmailView.as_view(),
        name="verify-email",
    ),
    path(
        "auth/login/",
        views.CookieTokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "auth/login/verify/",
        views.VerifyLoginView.as_view(),
        name="login-verify",
    ),
    path(
        "auth/password-reset/",
        views.PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "auth/password-reset/confirm/<str:uid>/<str:token>/",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path(
        "auth/refresh/",
        views.CookieTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/account/", views.AccountView.as_view(), name="account"),
    path("auth/account/password/", views.PasswordChangeView.as_view(), name="password-change"),
    path("auth/account/email/", views.EmailChangeRequestView.as_view(), name="email-change-request"),
    path("auth/account/email/confirm/<uuid:uid>/<str:token>/", views.EmailChangeConfirmView.as_view(), name="email-change-confirm"),
    path("auth/account/logout-all/", views.LogoutAllView.as_view(), name="logout-all"),
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
    # News
    path("news/", views.NewsList.as_view(), name="news-view"),
    path("news/<int:pk>/", views.NewsDetail.as_view(), name="news-detail"),
    path("news/<int:pk>/read/", views.NewsMarkRead.as_view(), name="news-read"),
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

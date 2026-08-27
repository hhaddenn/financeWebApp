from django.urls import path

from . import views

urlpatterns = [
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
]

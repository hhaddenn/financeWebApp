from django.urls import path

from . import views

urlpatterns = [
   #Accounts
    path("accounts/", views.AccountsList.as_view(), name="accounts-view"),
   #Categories
    path("categories/", views.CategoriesList.as_view(), name="categories-view"),
   #Subcategories
    path(
        "subcategories/",
        views.SubcategoriesList.as_view(),
        name="subcategories-view",
    ),
   #Transactions
    path(
        "transactions/",
        views.TransactionsList.as_view(),
        name="transactions-view",
    ),
]

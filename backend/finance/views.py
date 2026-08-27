from rest_framework import generics

from .models import Account, Category, Subcategory, Transaction
from .serializers import (
    AccountSerializer,
    CategorySerializer,
    SubcategorySerializer,
    TransactionSerializer,
)

# Create your views here.


# Accounts
class AccountsList(generics.ListAPIView):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


# Categories
class CategoriesList(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# Subcategories
class SubcategoriesList(generics.ListAPIView):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer


# Transactions
class TransactionsList(generics.ListAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

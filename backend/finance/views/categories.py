from rest_framework import generics

from ..models import Category, Subcategory
from ..serializers import CategorySerializer, SubcategorySerializer


class CategoriesList(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SubcategoriesList(generics.ListAPIView):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer
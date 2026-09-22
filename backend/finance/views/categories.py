from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..models import Category, Subcategory
from ..serializers import CategorySerializer, SubcategorySerializer


class CategoriesList(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CategorySerializer

    def get_queryset(self):
        category_type = self.request.query_params.get("category_type")
        return Category.objects.filter(category_type=category_type)


class SubcategoriesList(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer

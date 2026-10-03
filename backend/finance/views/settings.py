from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..models import (
    UserCategoryPreference,
    UserSubcategoryPreference,
)
from ..serializers import (
    UserCategoryPreferenceSerializer,
    UserSettingsSerializer,
    UserSubcategoryPreferenceSerializer,
)


class UserSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user.settings


class UserCategoryPreferencesView(generics.ListAPIView):
    serializer_class = UserCategoryPreferenceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return UserCategoryPreference.objects.filter(
            user=self.request.user
        ).select_related("category")


class UserCategoryPreferenceDetail(generics.RetrieveUpdateAPIView):
    serializer_class = UserCategoryPreferenceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return UserCategoryPreference.objects.filter(
            user=self.request.user
        ).select_related("category")


class UserSubcategoryPreferencesView(generics.ListAPIView):
    serializer_class = UserSubcategoryPreferenceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return UserSubcategoryPreference.objects.filter(
            user=self.request.user
        ).select_related(
            "subcategory",
            "subcategory__category",
        )


class UserSubcategoryPreferenceDetail(generics.RetrieveUpdateAPIView):
    serializer_class = UserSubcategoryPreferenceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return UserSubcategoryPreference.objects.filter(
            user=self.request.user
        ).select_related(
            "subcategory",
            "subcategory__category",
        )
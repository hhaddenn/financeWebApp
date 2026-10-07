from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..models import RecurringTransaction
from ..serializers import RecurringTransactionSerializer
from ..services import calculate_next_run_at


class RecurringTransactionsList(generics.ListAPIView):
    serializer_class = RecurringTransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)


class RecurringTransactionCreate(generics.CreateAPIView):
    serializer_class = RecurringTransactionSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        recurring_transaction = serializer.save(user=self.request.user)

        recurring_transaction.next_run_at = calculate_next_run_at(
            recurring_transaction
        )

        recurring_transaction.save(
            update_fields=["next_run_at"]
        )


class RecurringTransactionDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecurringTransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return RecurringTransaction.objects.filter(
            user=self.request.user
        ).select_related(
            "account",
            "subcategory",
            "subcategory__category",
        )

    def perform_update(self, serializer):
        recurring_transaction = serializer.save()

        schedule_fields = {
            "frequency",
            "day_of_week",
            "day_of_month",
            "month",
        }

        if any(
            field in serializer.validated_data
            for field in schedule_fields
        ):
            recurring_transaction.next_run_at = calculate_next_run_at(
                recurring_transaction
            )
            recurring_transaction.save(
                update_fields=["next_run_at"]
            )
from calendar import monthrange
from datetime import timedelta
from decimal import Decimal
from math import ceil

from django.db.models import Sum
from django.db.models.functions import ExtractMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Transaction


class DashboardMonthlySummary(APIView):
	permission_classes = (IsAuthenticated,)

	def get(self, request):
		period = request.query_params.get("period", "year")
		if period not in ("year", "month", "week"):
			return Response(
				{"period": "Invalid period."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		# MONTH FILTER
		if period == "month":
			date = timezone.localdate()
			first_weekday, days_in_month = monthrange(date.year, date.month)
			week_count = ceil((first_weekday + days_in_month) / 7)

			weeks = [
				{
					"week": week,
					"income": Decimal("0.00"),
					"expense": Decimal("0.00"),
				}
				for week in range(1, week_count + 1)
			]

			transactions = Transaction.objects.filter(
				account__user=request.user,
				date__year=date.year,
				date__month=date.month,
				transaction_type__in=("income", "expense"),
			)

			for transaction in transactions:
				transaction_day = transaction.date.day
				week_index = (transaction_day - 1 + first_weekday) // 7

				weeks[week_index][transaction.transaction_type] += transaction.amount

			for week in weeks:
				for transaction_type in ("income", "expense"):
					week[transaction_type] = str(week[transaction_type])

			return Response({"weeks": weeks})

		# WEEK FILTER
		if period == "week":
			today = timezone.localdate()
			monday = today - timedelta(days=today.weekday())
			sunday = monday + timedelta(days=6)

			days = [
				{
					"date": (monday + timedelta(days=offset)).isoformat(),
					"income": Decimal("0.00"),
					"expense": Decimal("0.00"),
				}
				for offset in range(7)
			]

			transactions = Transaction.objects.filter(
				account__user=request.user,
				date__range=(monday, sunday),
				transaction_type__in=("income", "expense"),
			)

			for transaction in transactions:
				day_index = transaction.date.weekday()

				days[day_index][transaction.transaction_type] += transaction.amount

			for day in days:
				for transaction_type in ("income", "expense"):
					day[transaction_type] = str(day[transaction_type])

			return Response({"days": days})

		# YEAR FILTER
		year_param = request.query_params.get("year", str(timezone.localdate().year))

		try:
			year = int(year_param)
		except (TypeError, ValueError):
			return Response(
				{"year": "Invalid year."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if not 1 <= year <= 9999:
			return Response(
				{"year": "Invalid year."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		totals = (
			Transaction.objects.filter(
				account__user=request.user,
				date__year=year,
				transaction_type__in=("income", "expense"),
			)
			.annotate(month=ExtractMonth("date"))
			.values("month", "transaction_type")
			.annotate(total=Sum("amount"))
		)

		months = [
			{
				"month": month,
				"income": "0.00",
				"expense": "0.00",
			}
			for month in range(1, 13)
		]

		for row in totals:
			month_index = row["month"] - 1
			transaction_type = row["transaction_type"]

			months[month_index][transaction_type] = str(row["total"])

		return Response(
			{
				"year": year,
				"months": months,
			}
		)


class DashboardCategorySummary(APIView):
	permission_classes = (IsAuthenticated,)

	def get(self, request):
		period = request.query_params.get("period", "month")
		transaction_type = request.query_params.get("transaction_type", "expense")

		if period not in ("year", "month", "week"):
			return Response(
				{"period": "Invalid period."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if transaction_type not in ("income", "expense"):
			return Response(
				{"transaction_type": "Invalid transaction type."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		today = timezone.localdate()
		base_transactions = Transaction.objects.filter(
			account__user=request.user,
			transaction_type=transaction_type,
		)

		if period == "month":
			transactions = base_transactions.filter(
				date__year=today.year,
				date__month=today.month,
			)

		elif period == "year":
			transactions = base_transactions.filter(date__year=today.year)

		elif period == "week":
			monday = today - timedelta(days=today.weekday())
			sunday = monday + timedelta(days=6)

			transactions = base_transactions.filter(date__range=(monday, sunday))

		totals = (
			transactions.filter(subcategory__category__isnull=False)
			.values("subcategory__category", "subcategory__category__name")
			.annotate(total=Sum("amount"))
		)

		categories = []

		for row in totals:
			categories.append(
				{
					"category_id": row["subcategory__category"],
					"category_name": row["subcategory__category__name"],
					"total": str(row["total"]),
				}
			)

		return Response({"categories": categories})

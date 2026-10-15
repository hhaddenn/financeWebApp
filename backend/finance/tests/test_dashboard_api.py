from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from unittest.mock import patch

from finance.models import Account, Transaction, TransactionType

User = get_user_model()


class DashboardAPITests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="active",
			email="active@example.com",
			password="StrongPassword1!",
		)

		self.client.force_authenticate(user=self.user)

		self.account = Account.objects.create(
			name="Dashboard Test",
			user=self.user,
			initial_balance=Decimal("100.00"),
			balance=Decimal("100.00"),
			icon="landmark",
		)

	def test_invalid_period_returns_400(self):
		url = reverse("dashboard-monthly-summary")

		response = self.client.get(
			url,
			{"period": "banana"},
		)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data["period"], "Invalid period.")

	def test_dashboard_requires_authentication(self):
		self.client.force_authenticate(user=None)

		url = reverse("dashboard-monthly-summary")

		response = self.client.get(
			url,
			{"period": "year"},
		)

		self.assertEqual(response.status_code, 401)

	def test_year_summary_without_transactions(self):
		url = reverse("dashboard-monthly-summary")

		response = self.client.get(
			url,
			{"period": "year"},
		)

		self.assertEqual(response.status_code, 200)

		first_month = response.data["months"][0]

		self.assertEqual(len(response.data["months"]), 12)
		self.assertEqual(first_month["income"], "0.00")
		self.assertEqual(first_month["expense"], "0.00")

	def test_expense_is_included_in_correct_month(self):
		url = reverse("dashboard-monthly-summary")

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 4, 15),
			account=self.account,
			checked=True,
		)

		response = self.client.get(
			url,
			{"period": "year", "year": "2025"},
		)

		self.assertEqual(response.status_code, 200)

		month_values = response.data["months"][3]

		self.assertEqual(month_values["expense"], "25.00")

	def test_excludes_other_users_transactions(self):
		url = reverse("dashboard-monthly-summary")

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 4, 15),
			account=self.account,
			checked=True,
		)

		other_user = User.objects.create_user(
			username="other",
			email="other@example.com",
			password="StrongPassword1!",
		)

		other_account = Account.objects.create(
			name="Dashboard Test Other",
			user=other_user,
			initial_balance=Decimal("200.00"),
			balance=Decimal("200.00"),
			icon="landmark",
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("100.00"),
			date=date(2025, 4, 15),
			account=other_account,
			checked=True,
		)

		response = self.client.get(
			url,
			{"period": "year", "year": 2025},
		)

		self.assertEqual(response.status_code, 200)

		month_values = response.data["months"][3]

		self.assertEqual(month_values["expense"], "25.00")


	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 15),
	)
	def test_month_summary_groups_by_weeks(self, _mock_today):
		url = reverse("dashboard-monthly-summary")

		response = self.client.get(
			url,
			{"period": "month"},
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data["weeks"]), 5)


	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 15),
	)
	def test_month_summary_includes_expense_in_correct_week(self, _mock_today):
		url = reverse("dashboard-monthly-summary")

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 4, 15),
			account=self.account,
			checked=True,
		)

		response = self.client.get(
			url,
			{"period": "month"},
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["weeks"][2]["expense"], "25.00")


	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 15),
	)
	def test_week_summary_returns_seven_days(self, _mock_today):
		url = reverse("dashboard-monthly-summary")

		response = self.client.get(
			url,
			{"period": "week"},
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data["days"]), 7)
		self.assertEqual(response.data["days"][0]["date"], "2025-04-14")
		self.assertEqual(response.data["days"][-1]["date"], "2025-04-20")


	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 15),
	)
	def test_week_summary_includes_expense_in_correct_day(self, _mock_today):
		url = reverse("dashboard-monthly-summary")

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 4, 15),
			account=self.account,
			checked=True,
		)

		response = self.client.get(
			url,
			{"period": "week"},
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["days"][1]["expense"], "25.00")
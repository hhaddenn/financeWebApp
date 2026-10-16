from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from finance.models import Account, Category, Subcategory, Transaction, TransactionType

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

	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 1),
	)
	def test_week_summary_crosses_months(self, _mock_today):
		url = reverse("dashboard-monthly-summary")

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 3, 31),
			account=self.account,
			checked=True,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("15.00"),
			date=date(2025, 4, 1),
			account=self.account,
			checked=True,
		)

		response = self.client.get(
			url,
			{"period": "week"},
		)

		self.assertEqual(response.status_code, 200)

		self.assertEqual(response.data["days"][0]["expense"], "25.00")
		self.assertEqual(response.data["days"][1]["expense"], "15.00")

		# CATEGORY SUMMARY

	def test_category_summary_without_transactions(self):
		url = reverse("dashboard-category-summary")

		response = self.client.get(
			url,
			{"transaction_type": "expense", "period": "week"},
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["categories"], [])

	def test_category_summary_rejects_invalid_period(self):
		url = reverse("dashboard-category-summary")

		response = self.client.get(
			url,
			{"transaction_type": "expense", "period": "banana"},
		)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data["period"], "Invalid period.")

	def test_category_summary_rejects_invalid_transaction_type(self):
		url = reverse("dashboard-category-summary")

		response = self.client.get(
			url,
			{"transaction_type": "banana", "period": "month"},
		)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data["transaction_type"], "Invalid transaction type.")

	def test_category_summary_aggregates_expenses(self):
		url = reverse("dashboard-category-summary")

		category = Category.objects.create(
			name="Dashboard Test Food",
			icon="utensils",
			category_type="expense",
		)

		subcategory = Subcategory.objects.create(
			name="Groceries",
			icon="shopping-cart",
			category=category,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=timezone.localdate(),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("15.00"),
			date=timezone.localdate(),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		response = self.client.get(
			url,
			{"transaction_type": "expense", "period": "month"},
		)

		self.assertEqual(response.status_code, 200)

		categories = response.data["categories"]

		self.assertEqual(len(categories), 1)
		self.assertEqual(categories[0]["category_id"], category.id)
		self.assertEqual(categories[0]["total"], "40.00")

	def test_category_summary_excludes_other_users_transactions(self):
		url = reverse("dashboard-category-summary")

		category = Category.objects.create(
			name="Dashboard Test Food",
			icon="utensils",
			category_type="expense",
		)

		subcategory = Subcategory.objects.create(
			name="Groceries",
			icon="shopping-cart",
			category=category,
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
			amount=Decimal("25.00"),
			date=timezone.localdate(),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("100.00"),
			date=timezone.localdate(),
			account=other_account,
			subcategory=subcategory,
			checked=True,
		)

		response = self.client.get(
			url,
			{"transaction_type": "expense", "period": "month"},
		)

		self.assertEqual(response.status_code, 200)

		categories = response.data["categories"]

		self.assertEqual(len(categories), 1)
		self.assertEqual(categories[0]["category_id"], category.id)
		self.assertEqual(categories[0]["total"], "25.00")

	def test_category_summary_filters_income(self):
		url = reverse("dashboard-category-summary")

		category = Category.objects.create(
			name="Dashboard Test Food",
			icon="utensils",
			category_type="income",
		)

		subcategory = Subcategory.objects.create(
			name="Groceries",
			icon="shopping-cart",
			category=category,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.INCOME,
			amount=Decimal("150.00"),
			date=timezone.localdate(),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		response = self.client.get(
			url,
			{"transaction_type": "income", "period": "month"},
		)

		self.assertEqual(response.status_code, 200)

		categories = response.data["categories"]

		self.assertEqual(len(categories), 1)
		self.assertEqual(categories[0]["total"], "150.00")

		expense_response = self.client.get(
			url, {"transaction_type": "expense", "period": "month"}
		)

		self.assertEqual(expense_response.status_code, 200)
		self.assertEqual(expense_response.data["categories"], [])

	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 1),
	)
	def test_category_summary_week_crosses_months(self, _mock_today):
		url = reverse("dashboard-category-summary")

		category = Category.objects.create(
			name="Dashboard Test Food",
			icon="utensils",
			category_type="income",
		)

		subcategory = Subcategory.objects.create(
			name="Groceries",
			icon="shopping-cart",
			category=category,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 3, 31),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("15.00"),
			date=date(2025, 4, 1),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		response = self.client.get(
			url,
			{"transaction_type": "expense", "period": "week"},
		)

		self.assertEqual(response.status_code, 200)

		categories = response.data["categories"]

		self.assertEqual(categories[0]["total"], "40.00")

	@patch(
		"finance.views.dashboard.timezone.localdate",
		return_value=date(2025, 4, 15),
	)
	def test_category_summary_filters_current_year(self, _mock_today):
		url = reverse("dashboard-category-summary")

		category = Category.objects.create(
			name="Dashboard Test Food",
			icon="utensils",
			category_type="income",
		)

		subcategory = Subcategory.objects.create(
			name="Groceries",
			icon="shopping-cart",
			category=category,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("100.00"),
			date=date(2024, 12, 31),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("25.00"),
			date=date(2025, 1, 15),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		Transaction.objects.create(
			transaction_type=TransactionType.EXPENSE,
			amount=Decimal("15.00"),
			date=date(2025, 4, 15),
			account=self.account,
			subcategory=subcategory,
			checked=True,
		)

		response = self.client.get(
			url,
			{"transaction_type": "expense", "period": "year"},
		)

		self.assertEqual(response.status_code, 200)

		categories = response.data["categories"]

		self.assertEqual(len(categories), 1)
		self.assertEqual(categories[0]["total"], "40.00")

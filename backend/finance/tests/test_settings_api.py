from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from finance.models import (
	UserSettings,
)

User = get_user_model()


class UserSettingsAPITests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="active",
			email="active@example.com",
			password="StrongPassword1!",
		)

		self.client.force_authenticate(user=self.user)

	def test_dashboard_bar_period_is_saved(self):
		url = reverse("user-settings-view")

		response = self.client.patch(
			url,
			{"dashboard_bar_period": "week"},
		)

		self.assertEqual(response.status_code, 200)

		settings = UserSettings.objects.get(user=self.user)

		self.assertEqual(settings.dashboard_bar_period, "week")

	def test_dashboard_bar_period_rejects_invalid_value(self):
		url = reverse("user-settings-view")

		response = self.client.patch(url, {"dashboard_bar_period": "banana"})

		self.assertEqual(response.status_code, 400)

		settings = UserSettings.objects.get(user=self.user)

		self.assertEqual(settings.dashboard_bar_period, "year")

	def test_dashboard_donut_preferences_are_saved(self):
		url = reverse("user-settings-view")

		response = self.client.patch(
			url,
			{
				"dashboard_donut_type": "income",
				"dashboard_donut_period": "week",
			},
		)

		self.assertEqual(response.status_code, 200)

		settings = UserSettings.objects.get(user=self.user)

		self.assertEqual(settings.dashboard_donut_type, "income")
		self.assertEqual(settings.dashboard_donut_period, "week")

	def test_account_visibility_is_saved(self):
		url = reverse("user-settings-view")

		initial_response = self.client.get(url)

		self.assertEqual(initial_response.status_code, 200)
		self.assertFalse(initial_response.data["show_balance_by_default"])

		response = self.client.patch(url, {"show_balance_by_default": True})

		self.assertEqual(response.status_code, 200)

		settings = UserSettings.objects.get(user=self.user)

		self.assertTrue(settings.show_balance_by_default)

		final_response = self.client.get(url)

		self.assertEqual(final_response.status_code, 200)
		self.assertTrue(final_response.data["show_balance_by_default"])

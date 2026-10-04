from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from finance.models import Account

User = get_user_model()


class AccountAPITests(APITestCase):
   def setUp(self):
      self.user = User.objects.create_user(
         username="active",
         email="active@example.com",
         password="StrongPassword1!",
      )

      self.account = Account.objects.create(
         name="Main Account",
         user=self.user,
         initial_balance=Decimal("100.00"),
         balance=Decimal("344.20"),
         icon="landmark",
      )

      self.client.force_authenticate(user=self.user)
   
   def test_user_can_manually_correct_current_balance(self):
      url = reverse(
         "account-retrieve-update-destroy-view",
         args=[self.account.id],
      )

      response = self.client.patch(
         url,
         {"balance": "343.23"},
         format="json",
      )

      self.account.refresh_from_db()

      self.assertEqual(response.status_code, 200)
      self.assertEqual(self.account.balance, Decimal("343.23"))
      self.assertEqual(self.account.initial_balance, Decimal("100.00"))
      
   def test_user_cannot_change_initial_balance_after_creation(self):
      url = reverse(
         "account-retrieve-update-destroy-view",
         args=[self.account.id],
      )

      response = self.client.patch(
         url,
         {"initial_balance": "120.00"},
         format="json",
      )

      self.account.refresh_from_db()

      self.assertEqual(response.status_code, 400)
      self.assertEqual(self.account.initial_balance, Decimal("100.00"))
      self.assertEqual(self.account.balance, Decimal("344.20"))
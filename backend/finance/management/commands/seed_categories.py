import json
from pathlib import Path

from django.core.management.base import BaseCommand

from finance.models import Category, Subcategory


class Command(BaseCommand):
    help = "Seed categories and subcategories"

    def handle(self, *args, **kwargs):
        file_path = (
            Path(__file__).resolve().parents[3]
            / "finance"
            / "data"
            / "categories.json"
        )

        with open(file_path, encoding="utf-8") as f:
            categories = json.load(f)

        for category_data in categories:
            category, _ = Category.objects.update_or_create(
                name=category_data["name"],
                defaults={
                    "icon": category_data["icon"],
                    "category_type": category_data["category_type"],
                    "description": "",
                },
            )

            for subcategory_data in category_data["subcategories"]:
                Subcategory.objects.update_or_create(
                    category=category,
                    name=subcategory_data["name"],
                    defaults={
                        "icon": subcategory_data["icon"],
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Categories seeded successfully!"
            )
        )
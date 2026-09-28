from django.conf import settings
from django.core.management.base import BaseCommand
import argostranslate.package
import argostranslate.translate

from finance.models import Category, Subcategory


class Command(BaseCommand):
    help = "Checks missing frontend translations"

    def handle(self, *args, **options):
        from_code = "en"
        to_code = "pt"

        # Download and install Argos Translate package
        argostranslate.package.update_package_index()
        available_packages = argostranslate.package.get_available_packages()
        package_to_install = next(
            filter(
                lambda x: x.from_code == from_code and x.to_code == to_code,
                available_packages,
            )
        )
        argostranslate.package.install_from_path(package_to_install.download())

        parent = settings.BASE_DIR.parent
        frontend = parent / "frontend"
        locales = frontend / "src" / "locales"
        languages = ["pt", "en"]

        for language in languages:
            self.check_language(language, locales, options["fix"])

    def add_arguments(self, parser):
        parser.add_argument("--fix", action="store_true")

    def check_language(self, language, locales, fix):
        files = list(locales.glob(language + ".js"))
        if files:
            file = files[0]
        else:
            self.stdout.write(f"The file {language}.js does not exist")
            return
        file_text = file.read_text()
        self.check_missing(Category, file_text, language, fix, file)
        self.check_missing(Subcategory, file_text, language, fix, file)

    def find_missing_translations(self, objects, translations):
        missing = []
        for item in objects:
            if item.name.replace(" ","") not in translations:
                missing.append(item.name)
        return missing

    def parse_translations(self, file_text, block_name):
        begin_block = file_text.find(f"{block_name}: {{")
        translations = {}
        if begin_block != -1:
            open_block = file_text.find("{", begin_block) + 1
            close_block = file_text.find("}", open_block)
            block = file_text[open_block:close_block]
            block_values = block.split(",")
            for item in block_values:
                if item.strip() == "":
                    continue
                key_value = item.split(":")
                key = key_value[0].strip()
                value = key_value[1].strip().strip("'")
                translations.update({key: value})
            return translations, True, close_block
        else:
            if block_name == "categories":
                open_block = file_text.find("settings: {")
                close_block = file_text.find("}", open_block)
            if block_name == "subcategories":
                open_block = file_text.find("categories: {")
                close_block = file_text.find("}", open_block)
            return translations, False, close_block

    def check_missing(self, object_model, file_text, language, fix, file):
        block_name = object_model.__name__.lower().replace("y", "ies")
        translation, block_exists, close_block = self.parse_translations(
            file_text, block_name
        )
        missing_translation = self.find_missing_translations(
            object_model.objects.all(), translation
        )
        if block_exists:
            self.stdout.write(
                str(len(missing_translation))
                + f" missing {block_name} "
                + language.upper()
                + " translation"
            )
            for missing in missing_translation:
                self.stdout.write("-" + missing)
            if fix and missing_translation:
                new_translations = ""
                for missing in missing_translation:
                    new_translations += (
                        f"      {missing.replace(" ","")}: '{self.translate(missing, language)}',\n"
                    )
                before = file_text[:close_block]
                after = file_text[close_block:]
                file_text = before + new_translations + after
                file.write_text(file_text)

        else:
            self.stdout.write(f"The block {block_name.capitalize()} does not exist")
            if fix:
                new_block = f"\n    {block_name}: {{\n"
                for missing in missing_translation:
                    new_block += (
                        f"      {missing.replace(" ","")}: '{self.translate(missing, language)}',\n"
                    )
                new_block += "  },\n"
                before = file_text[: close_block + 2]
                after = file_text[close_block + 2 :]
                file_text = before + new_block + after
                file.write_text(file_text)

    def translate(self, text, language):
        source_language = "en"
        translatedText = text
        if language != "en" :
            translatedText = argostranslate.translate.translate(
                text, source_language, language
            )
        return translatedText

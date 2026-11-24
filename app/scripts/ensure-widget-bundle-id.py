#!/usr/bin/env python3
"""
Verifica y registra automáticamente el Bundle ID 'com.treegoh.app.TreegohWidget'
en Apple Developer Portal a través de la API de App Store Connect en Codemagic.
"""

import os
import sys

WIDGET_BUNDLE_ID = "com.treegoh.app.TreegohWidget"
WIDGET_NAME = "Treegoh Widget Extension"

def main():
    key_id = os.environ.get("APP_STORE_CONNECT_KEY_IDENTIFIER", "").strip()
    issuer_id = os.environ.get("APP_STORE_CONNECT_ISSUER_ID", "").strip()
    private_key = os.environ.get("APP_STORE_CONNECT_PRIVATE_KEY", "").strip()

    if not (key_id and issuer_id and private_key):
        print("[TreegohWidget] Credenciales de App Store Connect no presentes en entorno; omitiendo registro automático.")
        return

    try:
        from codemagic.apple.app_store_connect import AppStoreConnectApiClient, KeyIdentifier, IssuerId, PrivateKey
        from codemagic.apple.resources import BundleIdPlatform

        client = AppStoreConnectApiClient(
            KeyIdentifier(key_id),
            IssuerId(issuer_id),
            PrivateKey(private_key),
        )
        existing = client.bundle_ids.list(
            bundle_id_filter=WIDGET_BUNDLE_ID,
            platform=BundleIdPlatform.IOS,
        )
        exact = [b for b in existing if b.attributes.identifier == WIDGET_BUNDLE_ID]
        if exact:
            print(f"[TreegohWidget] Bundle ID {WIDGET_BUNDLE_ID} ya está registrado en Apple Developer Portal.")
            return

        print(f"[TreegohWidget] Registrando nuevo Bundle ID {WIDGET_BUNDLE_ID} en Apple Developer Portal...")
        created = client.bundle_ids.create(
            WIDGET_BUNDLE_ID,
            WIDGET_NAME,
            platform=BundleIdPlatform.IOS,
        )
        print(f"[TreegohWidget] Bundle ID registrado con éxito: {created.id}")
    except Exception as exc:
        print(f"[TreegohWidget] Aviso durante verificación de Bundle ID: {exc}")

if __name__ == "__main__":
    main()

#!/bin/bash

# Setup para Testing en Dispositivos Reales - Taro
# Este script facilita el setup de testing

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Taro - Device Testing Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Verificar prerrequisitos
echo -e "${YELLOW}[1/5] Verificando requisitos previos...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no encontrado. Por favor instala Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm no encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Verificar Expo CLI
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}⚠ Expo CLI no encontrada. Instalando globalmente...${NC}"
    npm install -g expo-cli
fi
echo -e "${GREEN}✓ Expo CLI disponible${NC}"

# Verificar EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠ EAS CLI no encontrada. Instalando globalmente...${NC}"
    npm install -g eas-cli
fi
echo -e "${GREEN}✓ EAS CLI disponible${NC}"

echo ""
echo -e "${YELLOW}[2/5] Verificando login en Expo...${NC}"

# Verificar si está logueado en Expo
if ! expo whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ No estás logueado en Expo. Abriendo login...${NC}"
    expo login
else
    USER=$(expo whoami 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ Logueado como: $USER${NC}"
fi

echo ""
echo -e "${YELLOW}[3/5] Instalando dependencias...${NC}"

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi

echo ""
echo -e "${YELLOW}[4/5] Verificando configuración del proyecto...${NC}"

# Verificar que existen los archivos necesarios
if [ ! -f "app.json" ]; then
    echo -e "${RED}✗ app.json no encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Configuración encontrada${NC}"

echo ""
echo -e "${YELLOW}[5/5] Preparando para testing...${NC}"
echo ""

# Menú de opciones
echo -e "${GREEN}¿Qué deseas hacer?${NC}"
echo "1) Iniciar Expo Go (WiFi - Desarrollo rápido)"
echo "2) Crear build EAS (Producción - Dispositivo real)"
echo "3) Ver dispositivos conectados"
echo "4) Limpiar cache y reinstalar"
echo "5) Ver documentación de testing"
echo "6) Salir"
echo ""
read -p "Selecciona opción (1-6): " option

case $option in
    1)
        echo ""
        echo -e "${YELLOW}Iniciando Expo Go...${NC}"
        echo "Asegúrate de que:"
        echo "  • Tu dispositivo está en la misma WiFi"
        echo "  • Tienes Expo Go instalado"
        echo "  • Escanea el QR code con tu teléfono"
        echo ""
        read -p "¿Cuál app? (1=child, 2=parent): " app
        if [ "$app" = "1" ]; then
            npm run dev:child
        elif [ "$app" = "2" ]; then
            npm run dev:parent
        else
            echo -e "${RED}Opción inválida${NC}"
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Creando build EAS...${NC}"
        read -p "¿Cuál app? (1=child, 2=parent): " app
        read -p "¿Cuál plataforma? (1=ios, 2=android, 3=ambas): " platform

        if [ "$app" = "1" ]; then
            APP_DIR="apps/child"
            APP_NAME="Taro (Hijo)"
        elif [ "$app" = "2" ]; then
            APP_DIR="apps/parent"
            APP_NAME="Taro (Padre)"
        else
            echo -e "${RED}Opción inválida${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}Construyendo $APP_NAME para testing...${NC}"
        echo "Esto puede tomar 5-10 minutos"
        echo ""

        if [ "$platform" = "1" ] || [ "$platform" = "3" ]; then
            echo -e "${YELLOW}→ Building iOS...${NC}"
            cd $APP_DIR
            eas build --platform ios --profile testing
            cd - > /dev/null
        fi

        if [ "$platform" = "2" ] || [ "$platform" = "3" ]; then
            echo -e "${YELLOW}→ Building Android...${NC}"
            cd $APP_DIR
            eas build --platform android --profile testing
            cd - > /dev/null
        fi

        echo -e "${GREEN}✓ Build completado. Descarga desde el link que aparece arriba.${NC}"
        ;;
    3)
        echo ""
        echo -e "${YELLOW}Dispositivos conectados:${NC}"

        if command -v adb &> /dev/null; then
            echo ""
            echo "Android:"
            adb devices
        fi

        if [ "$(uname)" = "Darwin" ]; then
            echo ""
            echo "iOS:"
            system_profiler SPUSBDataType 2>/dev/null | grep -A 2 "iPhone" || echo "No iPhones detectados"
        fi
        ;;
    4)
        echo ""
        echo -e "${YELLOW}Limpiando cache...${NC}"
        expo prebuild --clean
        rm -rf node_modules
        npm install
        echo -e "${GREEN}✓ Cache limpiado y dependencias reinstaladas${NC}"
        ;;
    5)
        echo ""
        echo -e "${GREEN}Guías disponibles:${NC}"
        echo "  • DEVICE_TESTING.md - Testing completo en dispositivos reales"
        echo "  • TESTING.md - Testing manual en simuladores"
        echo "  • TROUBLESHOOTING.md - Solución de problemas (próximo)"
        echo ""
        if command -v open &> /dev/null; then
            read -p "¿Abrir DEVICE_TESTING.md? (s/n): " answer
            if [ "$answer" = "s" ]; then
                open DEVICE_TESTING.md
            fi
        fi
        ;;
    6)
        echo -e "${GREEN}¡Hasta luego!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Setup completado. ¡Feliz testing!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

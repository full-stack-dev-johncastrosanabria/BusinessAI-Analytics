#!/bin/bash
# Script para entrenar modelos 10X con alta confiabilidad

echo "=========================================="
echo "  Entrenamiento de Modelos 10X"
echo "=========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [[ ! -f "train_models.py" ]]; then
    echo "❌ Error: Ejecuta este script desde el directorio ai-service" >&2
    exit 1
fi

# Verificar que PyTorch esté instalado
echo "Verificando PyTorch..."
python3 -c "import torch; print(f'✓ PyTorch {torch.__version__} instalado')" 2>/dev/null
if [[ $? -ne 0 ]]; then
    echo "❌ PyTorch no está instalado" >&2
    echo "   Instalando PyTorch..."
    pip3 install torch --break-system-packages
fi

# Verificar contraseña de MySQL
if [[ -z "$MYSQL_PASSWORD" ]]; then
    echo ""
    echo "⚠️  La variable MYSQL_PASSWORD no está configurada"
    echo ""
    read -sp "Ingresa la contraseña de MySQL: " MYSQL_PASSWORD
    echo ""
    export MYSQL_PASSWORD
fi

# Verificar conexión a MySQL
echo ""
echo "Verificando conexión a MySQL..."
mysql -u root -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM businessai.business_metrics" > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "❌ No se puede conectar a MySQL" >&2
    echo "   Verifica que MySQL esté corriendo y la contraseña sea correcta" >&2
    exit 1
fi

METRICS_COUNT=$(mysql -u root -p"$MYSQL_PASSWORD" -N -e "SELECT COUNT(*) FROM businessai.business_metrics" 2>/dev/null)
echo "✓ Conexión exitosa - $METRICS_COUNT meses de datos disponibles"

if [[ "$METRICS_COUNT" -lt 24 ]]; then
    echo "⚠️  Advertencia: Se necesitan al menos 24 meses de datos"
    echo "   Tienes $METRICS_COUNT meses. ¿Continuar de todos modos? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
fi

# Entrenar modelos
echo ""
echo "=========================================="
echo "  Iniciando Entrenamiento 10X"
echo "=========================================="
echo ""
echo "Configuración:"
echo "  • 3 capas LSTM (128 unidades cada una)"
echo "  • 100 épocas con early stopping"
echo "  • Batch size: 32"
echo "  • Learning rate: 0.0005"
echo "  • Regularización avanzada"
echo ""
echo "Tiempo estimado: 5-10 minutos"
echo ""

# Ejecutar entrenamiento
python3 train_models.py

# Verificar resultado
if [[ $? -eq 0 ]]; then
    echo ""
    echo "=========================================="
    echo "  ✓ Entrenamiento Completado"
    echo "=========================================="
    echo ""
    echo "Modelos guardados en:"
    ls -lh trained_models/*.pt 2>/dev/null
    echo ""
    echo "Para usar los modelos, inicia el servicio:"
    echo "  MYSQL_PASSWORD=$MYSQL_PASSWORD python3 -m uvicorn main:app --port 8000"
else
    echo ""
    echo "❌ Error durante el entrenamiento" >&2
    echo "   Revisa los logs arriba para más detalles" >&2
    exit 1
fi

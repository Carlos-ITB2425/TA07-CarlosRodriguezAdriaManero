// Variables globales para almacenar datos
let electricityData = [];
let waterData = [];
let materialsData = [];

// Referencias a gráficos
let electricityConsumptionChart;
let electricitySelfConsumptionChart;
let waterConsumptionChart;
let materialsExpenseChart;
let materialsDistributionChart;

// Valores por defecto para calculadoras interactivas
let yearlyConsumption = 0;
let yearlyProduction = 0;
let yearlySelfConsumption = 0;

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha inicial (último mes)
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 1);

    document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = endDate;

    // Cargar datos iniciales
    fetchData(startDate, today);

    // Configurar eventos de cambio de pestaña
    setupTabNavigation();

    // Configurar evento para aplicar rango de fechas
    document.getElementById('apply-dates').addEventListener('click', function() {
        const startDateValue = document.getElementById('start-date').value;
        const endDateValue = document.getElementById('end-date').value;

        if (startDateValue && endDateValue) {
            const startDate = new Date(startDateValue);
            const endDate = new Date(endDateValue);
            fetchData(startDate, endDate);
        }
    });

    // Configurar evento para exportar a PDF
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);

    // Configurar controles interactivos
    setupInteractiveControls();
});

// Función para cargar datos del servidor
async function fetchData(startDate, endDate) {
    try {
        // Cargar datos de electricidad
        const electricityResponse = await fetch('json_data/electricity_bill.json');
        const electricityRawData = await electricityResponse.json();

        // Cargar datos de agua
        const waterResponse = await fetch('json_data/water_bill.json');
        const waterRawData = await waterResponse.json();

        // Cargar datos de materiales
        const materialsResponse = await fetch('json_data/materials_combined.json');
        const materialsRawData = await materialsResponse.json();

        // Filtrar datos según el rango de fechas seleccionado
        electricityData = filterDataByDateRange(electricityRawData, startDate, endDate, "Statistical Period");
        waterData = filterDataByDateRange(waterRawData, startDate, endDate, "FechaHora");
        materialsData = filterDataByDateRange(materialsRawData, startDate, endDate, "Fecha");

        // Actualizar gráficos y calculadoras
        updateCharts();
        updateCalculators();

    } catch (error) {
        console.error('Error al cargar los datos:', error);
        // Si hay un error al cargar los datos, usar datos simulados como fallback
        simulateDataAsFallback(startDate, endDate);
    }
}

// Función para filtrar datos según el rango de fechas
function filterDataByDateRange(data, startDate, endDate, dateField) {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= startTime && itemDate <= endTime;
    });
}

// Función para simular datos como fallback en caso de error
function simulateDataAsFallback(startDate, endDate) {
    console.log('Utilizando datos simulados como fallback');

    // Simular datos de electricidad
    simulateElectricityData(startDate, endDate);

    // Simular datos de agua
    simulateWaterData(startDate, endDate);

    // Simular datos de gastos materiales
    simulateMaterialsData(startDate, endDate);

    // Actualizar gráficos y calculadoras
    updateCharts();
    updateCalculators();
}

// Función para simular datos de electricidad (solo como fallback)
function simulateElectricityData(startDate, endDate) {
    electricityData = [];
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Variación estacional para hacer los datos más realistas
        const seasonalFactor = 1 + 0.3 * Math.sin((currentDate.getMonth() / 12) * 2 * Math.PI);

        // Valores base con algo de aleatoriedad
        const consumption = (120 + Math.random() * 80) * seasonalFactor;
        const selfConsumption = consumption * (0.2 + Math.random() * 0.3);
        const importkWh = consumption - selfConsumption;

        electricityData.push({
            "Statistical Period": currentDate.toISOString().split('T')[0] + "T00:00:00.000",
            "Import (kWh)": parseFloat(importkWh.toFixed(2)),
            "Consumption (kWh)": parseFloat(consumption.toFixed(2)),
            "Self-consumption (kWh)": parseFloat(selfConsumption.toFixed(2)),
            "Revenue (€)": parseFloat((selfConsumption * 0.12).toFixed(2))
        });
    }
}

// Función para simular datos de agua (solo como fallback)
function simulateWaterData(startDate, endDate) {
    waterData = [];
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Consumo base con variación
        const consumption = 150 + Math.round(Math.random() * 100);

        waterData.push({
            "CONSUM": consumption,
            "FechaHora": currentDate.toISOString().split('T')[0] + "T00:00:00.000"
        });
    }
}

// Función para simular datos de gastos materiales (solo como fallback)
function simulateMaterialsData(startDate, endDate) {
    materialsData = [];
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Productos de ejemplo
    const products = [
        { name: "Material de oficina", basePrice: 5.6, iva: 21 },
        { name: "Consumibles informáticos", basePrice: 25.8, iva: 21 },
        { name: "Material de limpieza", basePrice: 15.3, iva: 21 },
        { name: "Herramientas", basePrice: 45.9, iva: 21 },
        { name: "Materiales de construcción", basePrice: 120.5, iva: 21 }
    ];

    // Generar compras aleatorias durante el período
    for (let i = 0; i < daysDiff/5; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + Math.floor(Math.random() * daysDiff));

        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.ceil(Math.random() * 5);
        const price = parseFloat((product.basePrice * (0.8 + Math.random() * 0.4)).toFixed(2));
        const totalPrice = parseFloat((price * quantity).toFixed(2));
        const totalWithIVA = parseFloat((totalPrice * (1 + product.iva/100)).toFixed(2));

        materialsData.push({
            "N. Pedido": 100000 + Math.floor(Math.random() * 100000),
            "Fecha": currentDate.toISOString().split('T')[0] + "T00:00:00.000",
            "Producto": product.name,
            "Ctd": quantity,
            "Precio. U": price,
            "Precio": price,
            "Dto": 0,
            "Importe": totalPrice,
            "Importe IVA": totalWithIVA,
            "IVA": product.iva
        });
    }
}

// Función para actualizar todos los gráficos
function updateCharts() {
    updateElectricityCharts();
    updateWaterCharts();
    updateMaterialsCharts();
}

// Función para actualizar gráficos de electricidad
function updateElectricityCharts() {
    // Verificar si hay datos
    if (!electricityData || electricityData.length === 0) {
        console.warn('No hay datos de electricidad para mostrar en los gráficos');
        return;
    }

    // Preparar datos para gráfico de consumo vs importación
    const dates = electricityData.map(item => moment(item["Statistical Period"]).format('DD/MM/YYYY'));
    const consumption = electricityData.map(item => item["Consumption (kWh)"]);
    const imports = electricityData.map(item => item["Import (kWh)"]);
    const selfConsumption = electricityData.map(item => item["Self-consumption (kWh)"]);

    // Gráfico de consumo vs importación
    const consumptionChartCtx = document.getElementById('electricity-consumption-chart').getContext('2d');
    if (electricityConsumptionChart) {
        electricityConsumptionChart.destroy();
    }

    electricityConsumptionChart = new Chart(consumptionChartCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Consumo (kWh)',
                    data: consumption,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Importación (kWh)',
                    data: imports,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'kWh'
                    }
                }
            }
        }
    });

    // Gráfico de autoconsumo
    const selfConsumptionChartCtx = document.getElementById('electricity-self-consumption-chart').getContext('2d');
    if (electricitySelfConsumptionChart) {
        electricitySelfConsumptionChart.destroy();
    }

    electricitySelfConsumptionChart = new Chart(selfConsumptionChartCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Autoconsumo (kWh)',
                    data: selfConsumption,
                    backgroundColor: '#27ae60',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'kWh'
                    }
                }
            }
        }
    });
}

// Función para actualizar gráficos de agua
function updateWaterCharts() {
    // Verificar si hay datos
    if (!waterData || waterData.length === 0) {
        console.warn('No hay datos de agua para mostrar en los gráficos');
        return;
    }

    // Preparar datos para gráfico de consumo de agua
    const dates = waterData.map(item => moment(item.FechaHora).format('DD/MM/YYYY'));
    const consumption = waterData.map(item => item.CONSUM);

    // Gráfico de consumo de agua
    const waterChartCtx = document.getElementById('water-consumption-chart').getContext('2d');
    if (waterConsumptionChart) {
        waterConsumptionChart.destroy();
    }

    waterConsumptionChart = new Chart(waterChartCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Consumo (L)',
                    data: consumption,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Litros'
                    }
                }
            }
        }
    });
}

// Función para actualizar gráficos de gastos materiales
function updateMaterialsCharts() {
    // Verificar si hay datos
    if (!materialsData || materialsData.length === 0) {
        console.warn('No hay datos de materiales para mostrar en los gráficos');
        return;
    }

    // Preparar datos agrupados por mes
    const monthlyExpenses = {};
    const productCategories = {};

    materialsData.forEach(item => {
        const date = moment(item.Fecha);
        const monthYear = date.format('MM/YYYY');

        // Sumar gastos por mes
        if (!monthlyExpenses[monthYear]) {
            monthlyExpenses[monthYear] = 0;
        }
        monthlyExpenses[monthYear] += item["Importe IVA"];

        // Usar la categoría si está disponible, de lo contrario usar el producto
        const category = item.Category || item.Producto;

        // Sumar gastos por categoría de producto
        if (!productCategories[category]) {
            productCategories[category] = 0;
        }
        productCategories[category] += item["Importe IVA"];
    });

    // Preparar datos para gráficos
    const months = Object.keys(monthlyExpenses).sort((a, b) => {
        const [monthA, yearA] = a.split('/');
        const [monthB, yearB] = b.split('/');
        return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
    });
    const expenses = months.map(month => monthlyExpenses[month]);

    const productNames = Object.keys(productCategories);
    const productExpenses = productNames.map(product => productCategories[product]);

    // Gráfico de gastos por mes
    const expenseChartCtx = document.getElementById('materials-expense-chart').getContext('2d');
    if (materialsExpenseChart) {
        materialsExpenseChart.destroy();
    }

    materialsExpenseChart = new Chart(expenseChartCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Gasto (€)',
                    data: expenses,
                    backgroundColor: '#f39c12',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Gasto: ${context.raw.toFixed(2)} €`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Mes'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Euros (€)'
                    }
                }
            }
        }
    });

    // Gráfico de distribución de gastos por categoría
    const distributionChartCtx = document.getElementById('materials-distribution-chart').getContext('2d');
    if (materialsDistributionChart) {
        materialsDistributionChart.destroy();
    }

    materialsDistributionChart = new Chart(distributionChartCtx, {
        type: 'pie',
        data: {
            labels: productNames,
            datasets: [
                {
                    data: productExpenses,
                    backgroundColor: [
                        '#3498db',
                        '#e74c3c',
                        '#2ecc71',
                        '#f39c12',
                        '#9b59b6',
                        '#1abc9c',
                        '#d35400'
                    ]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toFixed(2)} € (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para actualizar todas las calculadoras
function updateCalculators() {
    updateElectricityCalculator();
    updateWaterCalculator();
    updateMaterialsCalculator();
}

// Función para actualizar calculadora de electricidad
function updateElectricityCalculator() {
    // Calcular valores para el día actual basados en el historial
    if (electricityData && electricityData.length > 0) {
        // Calcular promedios
        const totalConsumption = electricityData.reduce((sum, item) => sum + item["Consumption (kWh)"], 0);
        const totalImport = electricityData.reduce((sum, item) => sum + item["Import (kWh)"], 0);
        const totalSelfConsumption = electricityData.reduce((sum, item) => sum + item["Self-consumption (kWh)"], 0);

        const avgConsumption = totalConsumption / electricityData.length;
        const avgSelfConsumption = totalSelfConsumption / electricityData.length;
        const selfConsumptionPercentage = (avgSelfConsumption / avgConsumption) * 100;

        // Establecer valores estimados para hoy
        document.getElementById('today-consumption').textContent = `${avgConsumption.toFixed(2)} kWh`;
        document.getElementById('today-production').textContent = `${avgSelfConsumption.toFixed(2)} kWh`;
        document.getElementById('today-self-consumption').textContent = `${selfConsumptionPercentage.toFixed(2)}%`;

        // Establecer valores proyectados anuales
        yearlyConsumption = avgConsumption * 365;
        yearlyProduction = avgSelfConsumption * 365;
        yearlySelfConsumption = selfConsumptionPercentage;

        document.getElementById('yearly-consumption').textContent = `${yearlyConsumption.toFixed(2)} kWh`;
        document.getElementById('yearly-production').textContent = `${yearlyProduction.toFixed(2)} kWh`;
        document.getElementById('yearly-self-consumption').textContent = `${yearlySelfConsumption.toFixed(2)}%`;
    }
}

// Función para actualizar calculadora de agua
function updateWaterCalculator() {
    if (waterData && waterData.length > 0) {
        // Calcular promedio diario
        const totalConsumption = waterData.reduce((sum, item) => sum + item.CONSUM, 0);
        const avgDailyConsumption = totalConsumption / waterData.length;

        // Calcular estimaciones
        const estimatedMonthly = avgDailyConsumption * 30;
        const estimatedYearly = avgDailyConsumption * 365;

        // Actualizar interfaz
        document.getElementById('today-water-consumption').textContent = `${avgDailyConsumption.toFixed(0)} L`;
        document.getElementById('monthly-water-consumption').textContent = `${estimatedMonthly.toFixed(0)} L`;
        document.getElementById('yearly-water-consumption').textContent = `${estimatedYearly.toFixed(0)} L`;
    }
}

// Función para actualizar calculadora de gastos materiales
function updateMaterialsCalculator() {
    if (materialsData && materialsData.length > 0) {
        // Calcular gasto total
        const totalExpense = materialsData.reduce((sum, item) => sum + item["Importe IVA"], 0);

        // Calcular promedio diario
        const dates = materialsData.map(item => new Date(item.Fecha));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const daysDiff = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)));

        // Calcular estimaciones
        const dailyAverage = totalExpense / daysDiff;
        const estimatedYearly = dailyAverage * 365;
        const estimatedMonthly = estimatedYearly / 12;

        // Actualizar interfaz
        document.getElementById('yearly-materials-expense').textContent = `${estimatedYearly.toFixed(2)} €`;
        document.getElementById('monthly-materials-expense').textContent = `${estimatedMonthly.toFixed(2)} €`;
    }
}

// Función para configurar navegación entre pestañas
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar la pestaña seleccionada
            const tabId = button.getAttribute('data-tab');
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Función para configurar controles interactivos de la calculadora
function setupInteractiveControls() {
    const sections = document.querySelectorAll('.calculator-section.interactive');

    sections.forEach(section => {
        const decreaseButtons = section.querySelectorAll('.decrease');
        const increaseButtons = section.querySelectorAll('.increase');

        // Configurar botones de disminución
        decreaseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const valueElement = e.target.closest('.control-group').querySelector('.value');
                const id = valueElement.id;

                // Aplicar cambio según el elemento
                if (id === 'yearly-consumption') {
                    yearlyConsumption = Math.max(0, yearlyConsumption - 100);
                    valueElement.textContent = `${yearlyConsumption.toFixed(2)} kWh`;
                    updateDependentValues();
                } else if (id === 'yearly-production') {
                    yearlyProduction = Math.max(0, yearlyProduction - 100);
                    valueElement.textContent = `${yearlyProduction.toFixed(2)} kWh`;
                    updateDependentValues();
                } else if (id === 'yearly-self-consumption') {
                    yearlySelfConsumption = Math.max(0, yearlySelfConsumption - 5);
                    valueElement.textContent = `${yearlySelfConsumption.toFixed(2)}%`;
                    updateDependentValues(true);
                }
            });
        });

        // Configurar botones de aumento
        increaseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const valueElement = e.target.closest('.control-group').querySelector('.value');
                const id = valueElement.id;

                // Aplicar cambio según el elemento
                if (id === 'yearly-consumption') {
                    yearlyConsumption += 100;
                    valueElement.textContent = `${yearlyConsumption.toFixed(2)} kWh`;
                    updateDependentValues();
                } else if (id === 'yearly-production') {
                    yearlyProduction += 100;
                    valueElement.textContent = `${yearlyProduction.toFixed(2)} kWh`;
                    updateDependentValues();
                } else if (id === 'yearly-self-consumption') {
                    yearlySelfConsumption = Math.min(100, yearlySelfConsumption + 5);
                    valueElement.textContent = `${yearlySelfConsumption.toFixed(2)}%`;
                    updateDependentValues(true);
                }
            });
        });
    });
}

// Función para actualizar valores dependientes
function updateDependentValues(fromPercentage = false) {
    // Si cambia el porcentaje, actualizar producción
    if (fromPercentage) {
        yearlyProduction = (yearlyConsumption * yearlySelfConsumption) / 100;
        document.getElementById('yearly-production').textContent = `${yearlyProduction.toFixed(2)} kWh`;
    }
    // Si cambia consumo o producción, actualizar porcentaje
    else {
        yearlySelfConsumption = yearlyConsumption > 0 ? (yearlyProduction / yearlyConsumption) * 100 : 0;
        yearlySelfConsumption = Math.min(100, yearlySelfConsumption);
        document.getElementById('yearly-self-consumption').textContent = `${yearlySelfConsumption.toFixed(2)}%`;
    }
}

// Función para exportar a PDF
function exportToPDF() {
    // Obtener la pestaña activa
    const activeTab = document.querySelector('.tab-content.active');
    const tabName = activeTab.id;

    // Configurar el título según la pestaña
    let title = "Dashboard de Consumos y Gastos";
    if (tabName === 'electricity') {
        title = "Informe de Electricidad";
    } else if (tabName === 'water') {
        title = "Informe de Agua";
    } else if (tabName === 'materials') {
        title = "Informe de Gastos Materiales";
    }

    // Crear objeto jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Añadir título
    pdf.setFontSize(20);
    pdf.text(title, 105, 15, { align: 'center' });

    // Añadir fecha
    const today = new Date();
    pdf.setFontSize(10);
    pdf.text(`Generado el ${today.toLocaleDateString()} a las ${today.toLocaleTimeString()}`, 105, 25, { align: 'center' });

    // Añadir información del rango de fechas
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    pdf.text(`Período: ${startDate} - ${endDate}`, 105, 30, { align: 'center' });

    // Usar html2canvas para capturar los gráficos
    html2canvas(activeTab.querySelector('.charts-container')).then(canvas => {
        // Añadir la imagen de los gráficos al PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        pdf.addImage(imgData, 'JPEG', 10, 40, 190, 100);

        // Capturar la calculadora
        html2canvas(activeTab.querySelector('.calculator-container')).then(canvas2 => {
            const imgData2 = canvas2.toDataURL('image/jpeg', 0.8);
            pdf.addImage(imgData2, 'JPEG', 10, 150, 190, 100);

            // Guardar PDF
            pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        });
    });
}
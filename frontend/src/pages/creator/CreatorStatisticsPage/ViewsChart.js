import React from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ViewsChart({ data, loading }) {
  if (loading) {
    return (
      <div className="statistics-card statistics-card-wide">
        <h3 className="statistics-card-title">
          <i className="fas fa-chart-line"></i> Visualizaciones en el Tiempo
        </h3>
        <div className="chart-loading">
          <p>Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (!data || data.labels?.length === 0) {
    return (
      <div className="statistics-card statistics-card-wide">
        <h3 className="statistics-card-title">
          <i className="fas fa-chart-line"></i> Visualizaciones en el Tiempo
        </h3>
        <p className="statistics-empty">No hay datos suficientes para mostrar el gráfico</p>
      </div>
    );
  }

  const chartData = {
    labels: data.labels || [],
    datasets: [
      {
        label: 'Visualizaciones',
        data: data.values || [],
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(79, 86, 186, 0.4)');
          gradient.addColorStop(0.5, 'rgba(79, 86, 186, 0.2)');
          gradient.addColorStop(1, 'rgba(79, 86, 186, 0.05)');
          return gradient;
        },
        borderColor: '#4F56BA',
        borderWidth: 3,
        pointBackgroundColor: '#FAED5C',
        pointBorderColor: '#4F56BA',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#FAED5C',
        pointHoverBorderColor: '#F5F6F3',
        pointHoverBorderWidth: 3,
        tension: 0.4,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 10,
        shadowColor: 'rgba(79, 86, 186, 0.5)',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#F5F6F3',
          font: {
            size: 13,
            weight: '600',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(31, 34, 36, 0.95)',
        titleColor: '#F5F6F3',
        bodyColor: '#999AC6',
        borderColor: '#4F56BA',
        borderWidth: 2,
        padding: 16,
        displayColors: true,
        boxPadding: 8,
        titleFont: {
          size: 14,
          weight: '700',
        },
        bodyFont: {
          size: 13,
          weight: '500',
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + ' vistas';
            }
            return label;
          }
        }
      },
      title: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#999AC6',
          font: {
            size: 12,
            weight: '500',
          },
          padding: 10,
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        },
        grid: {
          color: 'rgba(153, 154, 198, 0.1)',
          drawBorder: false,
          borderDash: [5, 5],
        },
        border: {
          display: false,
        }
      },
      x: {
        ticks: {
          color: '#999AC6',
          font: {
            size: 11,
            weight: '500',
          },
          padding: 10,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: 'rgba(153, 154, 198, 0.05)',
          drawBorder: false,
        },
        border: {
          display: false,
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="statistics-card statistics-card-wide">
      <h3 className="statistics-card-title">
        <i className="fas fa-chart-line"></i> Visualizaciones en el Tiempo
      </h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

ViewsChart.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.array,
    values: PropTypes.array
  }),
  loading: PropTypes.bool.isRequired
};

import './App.css';
import { Filler } from 'chart.js';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, BarElement, Filler, zoomPlugin);

function App() {
  const { username, setUsername } = useAuth();
  const [nameInput, setNameInput] = useState('');
  const [chartData, setChartData] = useState<number[]>([]);
  const [theme, setTheme] = useState('light');

  const [coin, setCoin] = useState('bitcoin');
  const [days, setDays] = useState(7);
  const [currency, setCurrency] = useState('usd');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Инициализация темы при загрузке
  useEffect(() => {
    const initializeTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const initialTheme = storedTheme || systemTheme;
      
      setTheme(initialTheme);
      applyTheme(initialTheme);
    };

    const storedCoin = localStorage.getItem('coin');
    if (storedCoin) setCoin(storedCoin);
    const storedDays = localStorage.getItem('days');
    if (storedDays) setDays(parseInt(storedDays));
    const storedCurrency = localStorage.getItem('currency');
    if (storedCurrency) setCurrency(storedCurrency);
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setUsername(storedUsername);
    const storedHistory = localStorage.getItem('history');
    if (storedHistory) setHistory(JSON.parse(storedHistory));

    initializeTheme();
  }, [setUsername]);

  // Функция для применения темы
  const applyTheme = (newTheme: string) => {
    const html = document.documentElement;
    const body = document.body;
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      body.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  };

  // Функция переключения темы
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Переключение темы с', theme, 'на', newTheme); // Для отладки
    
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (username && coin) {
      fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=${currency}&days=${days}`)
        .then(res => res.json())
        .then(data => {
          const prices = data.prices.map((entry: number[]) => Math.round(entry[1]));
          setChartData(prices);
          if (prices.length >= 2) {
            const current = prices[prices.length - 1];
            const change = current - prices[0];
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const percent = ((current - prices[0]) / prices[0]) * 100;

            setCurrentPrice(current);
            setPriceChange(change);
            setMinPrice(min);
            setMaxPrice(max);
            setPercentChange(percent);

            const timestamp = new Date().toLocaleString();
            const record = {
              timestamp,
              coin,
              days,
              currency,
              currentPrice: current,
              priceChange: change,
              percentChange: percent.toFixed(2),
              minPrice: min,
              maxPrice: max,
            };
            setHistory(prev => {
              const updated = [record, ...prev].slice(0, 20);
              localStorage.setItem('history', JSON.stringify(updated));
              return updated;
            });

            if (Math.abs(percent) >= 10) {
              console.log(`📢 Уведомление Telegram: ${coin} изменился на ${percent.toFixed(2)}%`);
            }
          }
        })
        .catch(error => {
          console.error('Ошибка загрузки данных:', error);
        });
    }
  }, [username, coin, days, currency]);

  // Страница входа
  if (!username) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <div className={`p-6 rounded shadow w-full max-w-sm transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Вход
            </h2>
            <button
              onClick={toggleTheme}
              className={`text-sm px-3 py-1 rounded hover:opacity-80 transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {theme === 'light' ? '🌙 Темная' : '☀️ Светлая'}
            </button>
          </div>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Введите имя"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className={`w-full border px-3 py-2 rounded mb-4 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
            }`}
          />
          <button
            onClick={() => {
              if (nameInput.trim()) {
                setUsername(nameInput.trim());
                localStorage.setItem('username', nameInput.trim());
              }
            }}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-300"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  const chartConfig = {
    labels: chartData.map((_, i) => `День ${i + 1}`),
    datasets: [
      {
        type: chartType,
        label: `Цена ${coin.toUpperCase()}, ${currency.toUpperCase()}`,
        data: chartData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: function (context: any) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    aspectRatio: 1.25,
    plugins: {
      legend: { display: true },
      zoom: {
        pan: {
          enabled: true,
          mode: "x" as const,
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x" as const,
        },
      },
    },
  };

  // Основной интерфейс
  return (
    <div className={`min-h-screen p-10 text-lg md:text-xl lg:text-2xl transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        }`}>
          📊 Dashboard
        </h1>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className={`text-sm px-3 py-1 rounded hover:opacity-80 transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-white text-gray-900 hover:bg-gray-100' 
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {theme === 'light' ? '🌙 Темная' : '☀️ Светлая'}
          </button>
          <button
            onClick={() => {
              setUsername('');
              localStorage.removeItem('username');
            }}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors duration-300"
          >
            Выйти
          </button>
        </div>
      </div>
      
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <p>Добро пожаловать, {username}!</p>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={coin}
            onChange={(e) => {
              setCoin(e.target.value);
              localStorage.setItem('coin', e.target.value);
            }}
            className={`text-sm border rounded px-2 py-1 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            <option value="bitcoin">BTC</option>
            <option value="ethereum">ETH</option>
            <option value="dogecoin">DOGE</option>
          </select>
          <select
            value={days}
            onChange={(e) => {
              const d = parseInt(e.target.value);
              setDays(d);
              localStorage.setItem('days', String(d));
            }}
            className={`text-sm border rounded px-2 py-1 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            <option value={7}>7 дней</option>
            <option value={14}>14 дней</option>
            <option value={30}>30 дней</option>
          </select>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              localStorage.setItem('currency', e.target.value);
            }}
            className={`text-sm border rounded px-2 py-1 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
            className={`text-sm border rounded px-2 py-1 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            <option value="line">Линейный</option>
            <option value="bar">Столбчатый</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded shadow transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className="text-xl font-semibold mb-4">
            📈 Динамика {coin.toUpperCase()} за {days} дней ({currency.toUpperCase()})
          </h2>
          {currentPrice !== null && (
            <p className="mb-2">
              Цена сейчас: <span className="font-semibold">{currentPrice} {currency.toUpperCase()}</span>
            </p>
          )}
          {priceChange !== null && (
            <p className={priceChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {priceChange >= 0 ? '⬆' : '⬇'} Изменение: {priceChange} {currency.toUpperCase()}
            </p>
          )}
          {percentChange !== null && (
            <p>
              📊 Изменение: <strong>{percentChange.toFixed(2)}%</strong>
            </p>
          )}
          {minPrice !== null && maxPrice !== null && (
            <p>
              🔻 Мин: {minPrice} {currency.toUpperCase()} | 🔺 Макс: {maxPrice} {currency.toUpperCase()}
            </p>
          )}
          {chartData.length > 0 ? (
            <div className="relative mt-4">
              <Chart type={chartType} data={chartConfig} options={chartOptions} height={150} />
            </div>
          ) : (
            <p>Загрузка графика...</p>
          )}
        </div>
        
        <div className={`p-6 rounded shadow transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className="text-xl font-semibold mb-2">⚙️ Настройки</h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Конфигурация панели и действий.
          </p>
          <div className="mt-4">
            <p className="text-sm">
              <strong>Текущая тема:</strong> {theme === 'dark' ? 'Темная' : 'Светлая'}
            </p>
            <p className="text-sm mt-2">
              <strong>Монета:</strong> {coin.toUpperCase()}
            </p>
            <p className="text-sm mt-1">
              <strong>Период:</strong> {days} дней
            </p>
            <p className="text-sm mt-1">
              <strong>Валюта:</strong> {currency.toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className={`p-6 rounded shadow col-span-1 md:col-span-2 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className="text-xl font-semibold mb-2">📄 История</h2>
          <button
            className="mb-4 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors duration-300"
            onClick={() => {
              const csv = [
                ['Время', 'Монета', 'Период', 'Валюта', 'Текущая', 'Изменение', '%', 'Мин', 'Макс'],
                ...history.map(h => [
                  h.timestamp,
                  h.coin,
                  h.days,
                  h.currency,
                  h.currentPrice,
                  h.priceChange,
                  h.percentChange,
                  h.minPrice,
                  h.maxPrice,
                ]),
              ].map(row => row.join(',')).join('\n');

              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'history.csv';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            ⬇️ Экспорт CSV
          </button>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm border border-collapse">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <tr>
                  <th className="border p-1">⏱️</th>
                  <th className="border p-1">Coin</th>
                  <th className="border p-1">Days</th>
                  <th className="border p-1">Cur</th>
                  <th className="border p-1">Now</th>
                  <th className="border p-1">Δ</th>
                  <th className="border p-1">%</th>
                  <th className="border p-1">Min</th>
                  <th className="border p-1">Max</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="text-center border-t">
                    <td className="border p-1">{h.timestamp}</td>
                    <td className="border p-1">{h.coin}</td>
                    <td className="border p-1">{h.days}</td>
                    <td className="border p-1">{h.currency}</td>
                    <td className="border p-1">{h.currentPrice}</td>
                    <td className="border p-1">{h.priceChange}</td>
                    <td className="border p-1">{h.percentChange}%</td>
                    <td className="border p-1">{h.minPrice}</td>
                    <td className="border p-1">{h.maxPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
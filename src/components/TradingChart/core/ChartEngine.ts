import { 
  createChart, 
  IChartApi, 
  ISeriesApi,
  CandlestickSeries,
  CandlestickData,
  DeepPartial,
  ChartOptions,
  CandlestickSeriesOptions,
  Time 
} from 'lightweight-charts';

export interface ChartConfiguration {
  width: number;
  height: number;
  theme?: 'light' | 'dark';
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * ChartEngine - Abstraction layer for lightweight-charts
 * 
 * Provides a clean interface for chart operations while hiding
 * the complexity of direct lightweight-charts API usage.
 * 
 * Key responsibilities:
 * - Chart initialization and configuration
 * - Series management (candlestick, volume, etc.)
 * - Data updates and rendering
 * - Responsive behavior and cleanup
 */
export class ChartEngine {
  private chart: IChartApi | null = null;
  private candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the chart with a container element
   */
  async initialize(container: HTMLElement, config: ChartConfiguration): Promise<void> {
    if (this.chart) {
      this.destroy();
    }

    this.container = container;

    // Create chart with configuration
    const chartOptions: DeepPartial<ChartOptions> = {
      width: config.width,
      height: config.height,
      layout: {
        background: { color: config.theme === 'dark' ? '#1a1a1a' : '#ffffff' },
        textColor: config.theme === 'dark' ? '#ffffff' : '#333333',
      },
      grid: {
        vertLines: { color: config.theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
        horzLines: { color: config.theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: config.theme === 'dark' ? '#2a2a2a' : '#cccccc',
      },
      rightPriceScale: {
        borderColor: config.theme === 'dark' ? '#2a2a2a' : '#cccccc',
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
      },
    };

    this.chart = createChart(container, chartOptions);

    // Create candlestick series
    const seriesOptions: DeepPartial<CandlestickSeriesOptions> = {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    };

    this.candlestickSeries = this.chart.addSeries(CandlestickSeries, seriesOptions);

    // Setup responsive behavior
    this.setupResizeObserver();
  }

  /**
   * Update chart data - replaces all existing data
   */
  setData(data: CandleData[]): void {
    if (!this.candlestickSeries) {
      throw new Error('Chart not initialized');
    }

    // Convert to lightweight-charts format
    const chartData: CandlestickData[] = data.map(candle => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    this.candlestickSeries.setData(chartData);
  }

  /**
   * Update a single candle (for real-time updates)
   */
  updateCandle(candle: CandleData): void {
    if (!this.candlestickSeries) {
      throw new Error('Chart not initialized');
    }

    const chartCandle: CandlestickData = {
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    };

    this.candlestickSeries.update(chartCandle);
  }

  /**
   * Fit chart content to container
   */
  fitContent(): void {
    if (this.chart) {
      this.chart.timeScale().fitContent();
    }
  }

  /**
   * Get the current visible range
   */
  getVisibleRange(): { from: number; to: number } | null {
    if (!this.chart) return null;
    
    const timeScale = this.chart.timeScale();
    const visibleRange = timeScale.getVisibleRange();
    
    if (!visibleRange) return null;
    
    return {
      from: visibleRange.from as number,
      to: visibleRange.to as number,
    };
  }

  /**
   * Setup resize observer for responsive behavior
   */
  private setupResizeObserver(): void {
    if (!this.container || !this.chart) return;

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);
  }

  /**
   * Handle container resize
   */
  private handleResize(): void {
    if (!this.container || !this.chart) return;

    const { clientWidth, clientHeight } = this.container;
    this.chart.applyOptions({
      width: clientWidth,
      height: clientHeight,
    });
  }

  /**
   * Update chart theme
   */
  updateTheme(theme: 'light' | 'dark'): void {
    if (!this.chart) return;

    this.chart.applyOptions({
      layout: {
        background: { color: theme === 'dark' ? '#1a1a1a' : '#ffffff' },
        textColor: theme === 'dark' ? '#ffffff' : '#333333',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
        horzLines: { color: theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
      },
    });
  }

  /**
   * Clean up chart resources
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }

    this.candlestickSeries = null;
    this.container = null;
  }

  /**
   * Check if chart is initialized
   */
  isInitialized(): boolean {
    return this.chart !== null;
  }
}
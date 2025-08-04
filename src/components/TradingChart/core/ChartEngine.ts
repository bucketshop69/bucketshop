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
import { BUCKETSHOP_ELITE_THEME } from './theme';

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

  /**
   * Initialize the chart with a container element
   */
  async initialize(container: HTMLElement, config: ChartConfiguration): Promise<void> {
    if (this.chart) {
      this.destroy();
    }

    this.container = container;

    // Create chart with BucketShop Elite theme
    const isDark = config.theme === 'dark';
    const theme = BUCKETSHOP_ELITE_THEME;
    
    const chartOptions: DeepPartial<ChartOptions> = {
      width: config.width,
      height: config.height,
      layout: {
        background: { 
          color: isDark ? theme.background.primary : '#ffffff' 
        },
        textColor: isDark ? theme.text.primary : '#333333',
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { 
          color: isDark ? theme.grid.primary : '#f0f0f0',
          style: 0, // LineStyle.Solid
        },
        horzLines: { 
          color: isDark ? theme.grid.primary : '#f0f0f0',
          style: 0, // LineStyle.Solid
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDark ? theme.grid.secondary : '#cccccc',
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 0.5,
      },
      rightPriceScale: {
        borderColor: isDark ? theme.grid.secondary : '#cccccc',
        textColor: isDark ? theme.text.secondary : '#666666',
        entireTextOnly: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: isDark ? theme.grid.accent : '#cccccc',
          width: 1,
          style: 2, // LineStyle.Dashed
          labelBackgroundColor: isDark ? theme.accent.primary : '#4f46e5',
        },
        horzLine: {
          color: isDark ? theme.grid.accent : '#cccccc',
          width: 1,
          style: 2, // LineStyle.Dashed
          labelBackgroundColor: isDark ? theme.accent.primary : '#4f46e5',
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    this.chart = createChart(container, chartOptions);

    // Create candlestick series with elite theme colors
    const seriesOptions: DeepPartial<CandlestickSeriesOptions> = {
      upColor: isDark ? theme.trading.bull : '#26a69a',
      downColor: isDark ? theme.trading.bear : '#ef5350',
      borderVisible: false,
      wickUpColor: isDark ? theme.trading.bullWick : '#26a69a',
      wickDownColor: isDark ? theme.trading.bearWick : '#ef5350',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    };

    this.candlestickSeries = this.chart.addSeries(CandlestickSeries, seriesOptions);
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
   * Resize chart to specific dimensions
   */
  resize(width: number, height: number): void {
    if (!this.chart) return;

    this.chart.applyOptions({
      width,
      height,
    });
  }

  /**
   * Update chart theme with BucketShop Elite styling
   */
  updateTheme(themeMode: 'light' | 'dark'): void {
    if (!this.chart) return;

    const isDark = themeMode === 'dark';
    const theme = BUCKETSHOP_ELITE_THEME;

    this.chart.applyOptions({
      layout: {
        background: { 
          color: isDark ? theme.background.primary : '#ffffff' 
        },
        textColor: isDark ? theme.text.primary : '#333333',
      },
      grid: {
        vertLines: { 
          color: isDark ? theme.grid.primary : '#f0f0f0',
        },
        horzLines: { 
          color: isDark ? theme.grid.primary : '#f0f0f0',
        },
      },
      timeScale: {
        borderColor: isDark ? theme.grid.secondary : '#cccccc',
      },
      rightPriceScale: {
        borderColor: isDark ? theme.grid.secondary : '#cccccc',
        textColor: isDark ? theme.text.secondary : '#666666',
      },
      crosshair: {
        vertLine: {
          color: isDark ? theme.grid.accent : '#cccccc',
          labelBackgroundColor: isDark ? theme.accent.primary : '#4f46e5',
        },
        horzLine: {
          color: isDark ? theme.grid.accent : '#cccccc',
          labelBackgroundColor: isDark ? theme.accent.primary : '#4f46e5',
        },
      },
    });

    // Update candlestick series colors
    if (this.candlestickSeries) {
      this.candlestickSeries.applyOptions({
        upColor: isDark ? theme.trading.bull : '#26a69a',
        downColor: isDark ? theme.trading.bear : '#ef5350',
        wickUpColor: isDark ? theme.trading.bullWick : '#26a69a',
        wickDownColor: isDark ? theme.trading.bearWick : '#ef5350',
      });
    }
  }

  /**
   * Clean up chart resources
   */
  destroy(): void {
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
"""Pydantic schemas for investment strategy module - All agent outputs"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from enum import Enum


class Sentiment(str, Enum):
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AlignmentStatus(str, Enum):
    ALIGNED = "ALIGNED"
    PARTIALLY_ALIGNED = "PARTIALLY_ALIGNED"
    MISALIGNED = "MISALIGNED"


class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    COMPARISON = "comparison"
    GAUGE = "gauge"


class ChartAnnotation(BaseModel):
    value: float = Field(description="Value for the annotation line")
    label: str = Field(description="Label for the annotation")


class ChartData(BaseModel):
    labels: Optional[List[str]] = Field(None, description="X-axis labels or categories")
    values: List[float] = Field(description="Primary data values")
    secondary_values: Optional[List[float]] = Field(None, description="Secondary series for comparison")
    annotations: Optional[List[ChartAnnotation]] = Field(None, description="Reference lines or targets")


class ChartMeta(BaseModel):
    unit: Optional[str] = Field(None, description="Unit symbol like $ or %")
    positive_is_good: bool = Field(default=True, description="Whether positive values are good (for coloring)")


class Visualization(BaseModel):
    type: ChartType = Field(description="Chart type to render")
    title: str = Field(description="Chart title")
    description: Optional[str] = Field(None, description="What insight this chart shows")
    data: ChartData = Field(description="Chart data")
    meta: Optional[ChartMeta] = Field(None, description="Display metadata")


class VisualizationOutput(BaseModel):
    visualizations: List[Visualization] = Field(description="List of charts to render")
    reasoning: str = Field(description="Why these visualizations were chosen")


class NewsItem(BaseModel):
    headline: str = Field(description="News headline")
    source: str = Field(description="Source publication")
    date: Optional[str] = Field(None, description="Publication date if available")
    relevance: str = Field(description="Why this news is relevant")


class MarketDataAnalysisOutput(BaseModel):
    """Output schema for Data Analyst agent - includes numerical data from yfinance"""
    ticker_or_sector: str = Field(description="The analyzed ticker or sector")
    report_date: str = Field(description="Date of this analysis")
    executive_summary: List[str] = Field(description="3-5 key bullet points with specific numbers")
    sentiment: Sentiment = Field(description="Overall market sentiment")
    sentiment_reasoning: str = Field(description="Brief explanation of sentiment")
    
    current_price: Optional[float] = Field(None, description="Current stock price")
    price_change_percent: Optional[float] = Field(None, description="Price change percentage")
    market_cap: Optional[int] = Field(None, description="Market capitalization")
    pe_ratio: Optional[float] = Field(None, description="Trailing P/E ratio")
    forward_pe: Optional[float] = Field(None, description="Forward P/E ratio")
    week_52_high: Optional[float] = Field(None, description="52-week high price")
    week_52_low: Optional[float] = Field(None, description="52-week low price")
    beta: Optional[float] = Field(None, description="Stock beta for volatility")
    dividend_yield: Optional[float] = Field(None, description="Dividend yield if applicable")
    
    analyst_target_low: Optional[float] = Field(None, description="Analyst low price target")
    analyst_target_mean: Optional[float] = Field(None, description="Analyst mean price target")
    analyst_target_high: Optional[float] = Field(None, description="Analyst high price target")
    analyst_count: Optional[int] = Field(None, description="Number of analysts covering")
    recommendation: Optional[str] = Field(None, description="Analyst recommendation (buy/hold/sell)")
    
    price_history: Optional[List[float]] = Field(None, description="Historical closing prices for charting")
    price_dates: Optional[List[str]] = Field(None, description="Dates corresponding to price_history")
    
    recent_news: List[NewsItem] = Field(description="Key news items found")
    key_risks: List[str] = Field(description="Identified risk factors")
    key_opportunities: List[str] = Field(description="Identified opportunities")
    analyst_ratings_summary: Optional[str] = Field(None, description="Summary of analyst opinions")
    sources_count: int = Field(description="Number of sources consulted")


class TradingStrategy(BaseModel):
    """Single trading strategy"""
    strategy_name: str = Field(description="Descriptive name for the strategy")
    description: str = Field(description="Core idea and rationale")
    profile_alignment: str = Field(description="How it fits user's risk/horizon")
    key_indicators: List[str] = Field(description="What to monitor")
    entry_conditions: str = Field(description="When to enter")
    exit_conditions: str = Field(description="When to exit or take profits")
    specific_risks: List[str] = Field(description="Risks unique to this strategy")
    is_recommended: bool = Field(default=False, description="Top recommended strategy")


class TradingStrategiesOutput(BaseModel):
    """Output schema for Trading Analyst agent"""
    ticker_or_sector: str = Field(description="The analyzed ticker or sector")
    risk_tolerance: str = Field(description="User's risk tolerance")
    investment_horizon: str = Field(description="User's investment horizon")
    strategies: List[TradingStrategy] = Field(description="3-5 trading strategies")
    overall_approach: str = Field(description="Summary of the overall approach")


class StrategyExecution(BaseModel):
    """Execution details for a single strategy"""
    strategy_name: str = Field(description="Name of the strategy")
    order_types: str = Field(description="Recommended order types")
    position_sizing: str = Field(description="Position size guidance")
    entry_method: str = Field(description="How to enter the position")
    stop_loss: str = Field(description="Stop-loss placement")
    take_profit: str = Field(description="Profit-taking approach")
    management: str = Field(description="Ongoing position management")


class ExecutionPlanOutput(BaseModel):
    """Output schema for Execution Analyst agent"""
    general_principles: List[str] = Field(description="General execution principles")
    risk_management_approach: str = Field(description="Overall risk management")
    cost_control_measures: str = Field(description="How to minimize costs")
    monitoring_frequency: str = Field(description="How often to monitor")
    strategy_executions: List[StrategyExecution] = Field(description="Per-strategy execution plans")


class StrategyRisk(BaseModel):
    """Risk assessment for a single strategy"""
    strategy_name: str = Field(description="Name of the strategy")
    risk_level: RiskLevel = Field(description="Risk level for this strategy")
    key_risks: List[str] = Field(description="Key risks specific to this strategy")


class RiskAssessmentOutput(BaseModel):
    """Output schema for Risk Analyst agent"""
    overall_risk_level: RiskLevel = Field(description="Overall risk level")
    risk_summary: List[str] = Field(description="Key risk factors as bullet points")
    market_risks: List[str] = Field(description="Market-level risks")
    strategy_risks: List[StrategyRisk] = Field(description="Per-strategy risk assessment")
    execution_risks: List[str] = Field(description="Execution-related risks")
    alignment_status: AlignmentStatus = Field(description="Alignment with user profile")
    alignment_explanation: str = Field(description="Explanation of alignment check")
    mitigation_recommendations: List[str] = Field(description="Risk mitigation suggestions")


class InvestmentStrategyOutput(BaseModel):
    """Final output schema for Investment Coordinator agent"""
    strategy_name: str = Field(description="Name for this investment strategy")
    ticker_or_sector: str = Field(description="What was analyzed")
    risk_tolerance: str = Field(description="User's stated risk tolerance")
    investment_horizon: str = Field(description="User's stated investment horizon")
    market_analysis: MarketDataAnalysisOutput = Field(description="Market analysis results")
    trading_strategies: TradingStrategiesOutput = Field(description="Proposed trading strategies")
    execution_plan: ExecutionPlanOutput = Field(description="Execution plan")
    risk_assessment: RiskAssessmentOutput = Field(description="Risk assessment")
    disclaimer: str = Field(
        default="This information is for educational and informational purposes only. It does not constitute financial advice or investment recommendations. Consult a qualified financial advisor before making investment decisions.",
        description="Legal disclaimer"
    )


class StrategyRequest(BaseModel):
    """Input request for strategy generation"""
    ticker_or_sector: str = Field(..., description="Stock ticker or sector to analyze")
    risk_tolerance: Literal["conservative", "moderate", "aggressive"] = Field(
        ..., description="User's risk tolerance level"
    )
    investment_horizon: Literal["short", "medium", "long"] = Field(
        ..., description="Investment time horizon"
    )
    focus_areas: Optional[str] = Field(
        None, description="Additional context or preferences"
    )


class StrategyHistoryItem(BaseModel):
    """Summary item for strategy history list"""
    id: str
    ticker_or_sector: str
    strategy_name: str
    risk_tolerance: str
    investment_horizon: str
    processing_time: float
    created_at: str

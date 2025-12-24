"""
Comply Agent Pipeline with Dynamic Parallel Analyzers

Flow:
1. RouterAgent - Categorizes regulation into policy domains
2. RetrieverAgent - Fetches all relevant bank policies
3. ParallelAgent (dynamic) - One analyzer per policy, runs in parallel
4. AggregatorAgent - Combines all results into final report
"""

from google.adk.agents import SequentialAgent
from .router_agent import router_agent
from .retriever_agent import retriever_agent

# Export the sequential part (Router + Retriever)
# The parallel analysis and aggregation will be handled in the router endpoint
# because we need to dynamically create analyzers based on how many policies are found

comply_pipeline = SequentialAgent(
    name="ComplyPipeline",
    description="First two steps: categorize regulation and fetch bank policies.",
    sub_agents=[
        router_agent,      # Step 1: Categorize
        retriever_agent,   # Step 2: Fetch policies
    ]
)

# Export comply_pipeline as root_agent for compatibility
root_agent = comply_pipeline

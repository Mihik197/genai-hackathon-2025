"""
Comply Agent Pipeline

The RouterAgent categorizes the regulation.
Policy retrieval is handled directly in the endpoint for simplicity.
"""

from .router_agent import router_agent

# Export router_agent as root_agent
# Policy lookup is done directly in the endpoint after getting categories
root_agent = router_agent

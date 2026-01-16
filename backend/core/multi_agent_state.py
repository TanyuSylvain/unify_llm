"""
Multi-Agent Debate State Definitions

This module defines the state structure for the multi-agent debate workflow.
Uses a sliding window approach with summarization to manage context length.
"""

from typing import TypedDict, Optional, Annotated, List
from langgraph.graph import add_messages


class ExpertAnswer(TypedDict):
    """Structured expert answer format."""
    version: int
    understanding: str          # Problem understanding summary
    core_points: List[str]      # Core arguments/points
    details: str                # Detailed explanation
    conclusion: str             # Conclusion summary
    confidence: float           # Confidence level 0-1
    limitations: List[str]      # Known limitations
    modification_log: List[str] # Modification history across iterations


class CriticIssue(TypedDict):
    """Individual issue identified by critic."""
    category: str       # "logic" | "facts" | "completeness" | "relevance"
    severity: str       # "minor" | "moderate" | "major"
    description: str    # Issue description
    quote: str          # Original text citation (required to prevent hallucinated criticism)


class CriticReview(TypedDict):
    """Structured critic review format."""
    review_version: int
    overall_score: float        # 0-100 score
    passed: bool                # Whether answer meets threshold
    issues: List[CriticIssue]   # List of identified issues
    strengths: List[str]        # Positive aspects
    suggestions: List[str]      # Actionable improvement suggestions
    confidence: float           # Confidence in review 0-1


class MultiAgentState(TypedDict):
    """
    State for multi-agent debate workflow.

    Uses sliding window approach:
    - Only current iteration's full content is kept
    - Previous iterations are compressed into a summary
    """
    # Original question and assessment
    original_question: str
    complexity: str                     # "simple" | "moderate" | "complex"

    # Iteration control
    iteration: int
    max_iterations: int

    # Current iteration content (sliding window)
    current_answer: Optional[ExpertAnswer]      # Latest expert answer
    current_review: Optional[CriticReview]      # Latest critic review

    # Previous iterations compressed summary
    previous_summary: str               # Compressed summary of earlier iterations

    # Moderator guidance
    current_task: str                   # Moderator's instructions to expert
    improvement_guidance: str           # Specific feedback for expert improvement

    # Final output
    final_answer: Optional[str]
    termination_reason: Optional[str]   # "score_threshold" | "max_iterations" | "explicit_pass" | "convergence"

    # Workflow status
    status: str                         # "in_progress" | "completed" | "direct_answer"

    # Message history for LangGraph compatibility
    messages: Annotated[list, add_messages]


def create_initial_state(
    question: str,
    max_iterations: int = 3
) -> MultiAgentState:
    """Create initial state for a new debate workflow."""
    return MultiAgentState(
        original_question=question,
        complexity="",
        iteration=0,
        max_iterations=max_iterations,
        current_answer=None,
        current_review=None,
        previous_summary="",
        current_task="",
        improvement_guidance="",
        final_answer=None,
        termination_reason=None,
        status="in_progress",
        messages=[]
    )

from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv

load_dotenv()


@tool
def add(a: float, b: float) -> float:
    """Add two numbers together. Also useful for performing basic arithmetic"""
    return a + b


def main():
    # Try to connect to a local Ollama server (required for the LLM).
    agent_executor = None
    try:
        model = ChatOllama(
            model="gpt-oss:120b-cloud",
            base_url="http://127.0.0.1:11434",
            temperature=0
        )

        # Expose our tool for simple arithmetic
        tools = [add]
        agent_executor = create_react_agent(model, tools)
    except Exception as e:
        print("WARNING: Could not connect to Ollama at http://localhost:11434.")
        print("You can still chat with a limited local fallback (no LLM).\n")

    print("Welcome I am your AI Assistent. Type 'quit' to exit.")
    print("You can ask me to perform calculations or chat with me.")

    while True:
        user_input = input("\nYou: ").strip()

        if user_input == "quit":
            break

        if agent_executor is None:
            # Simple local fallback: echo and basic addition support.
            if user_input.lower().startswith("add "):
                parts = user_input.split()
                try:
                    a = float(parts[1])
                    b = float(parts[2])
                    print("\nAssistent: ", add(a, b))
                except Exception:
                    print("\nAssistent: Could not parse numbers. Use: add <num1> <num2>")
            else:
                print(f"\nAssistent: (fallback) You said: {user_input}")
            continue

        try:
            print("\nAssistent: ", end="")
            for chunk in agent_executor.stream(
                {"messages": [HumanMessage(content=user_input)]}
            ):
                if "agent" in chunk and "messages" in chunk["agent"]:
                    for message in chunk["agent"]["messages"]:
                        print(message.content, end="")
            print()
        except Exception:
            # If the LLM connection fails (e.g., Ollama not running), fall back.
            print("\nAssistent: (fallback) Could not reach Ollama; switching to local mode.")
            agent_executor = None
            if user_input.lower().startswith("add "):
                parts = user_input.split()
                try:
                    a = float(parts[1])
                    b = float(parts[2])
                    print("Assistent: ", add(a, b))
                except Exception:
                    print("Assistent: Could not parse numbers. Use: add <num1> <num2>")
            else:
                print(f"Assistent: (fallback) You said: {user_input}")


if __name__ == "__main__":
    main()

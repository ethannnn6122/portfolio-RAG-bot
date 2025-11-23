import React, { useState } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import styles from "./PortfolioChat.module.css";

// Config
const BACKEND_URL = "http://localhost:8000/retrieve-context";
const MODEL_ID = "Mistral-7B-Instruct-v0.3-q4f16_1-MLC";

type Role = "assistant" | "user" | "system";

interface ChatMessage {
  role: Role;
  content: string;
}

const PortfolioChat: React.FC = () => {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{ role: "assistant", content: "Hello! Ask me anything about Ethan's portfolio."}
	]);
	const [input, setInput] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [engine, setEngine] = useState<any | null>(null);
	const [downloadProgress, setDownloadProgress] = useState<string>("");
	const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
	const [showStartModal, setShowStartModal] = useState<boolean>(true);

    // Init the local LLM engine
	const initEngine = async () => {
		try {
			setDownloadProgress("Initializing WebGPU...");
		
			// GPU Check Debugging
			if (navigator.gpu) {
				const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
				if (adapter) {
					const info = adapter.info;
					console.log("🚀 Adapter Info:", JSON.stringify(info, null, 2));
				}
			}

			const eng = await CreateMLCEngine(
				MODEL_ID,
				{
				initProgressCallback: (report) => {
					setDownloadProgress(report.text);
				},
				}
			);
			
			setEngine(eng);
			setIsModelLoaded(true);
			setDownloadProgress(""); 
		} catch (error) {
			console.error("Error loading model:", error);
			setDownloadProgress("Error: Your browser may not support WebGPU.");
		}
  	};

  	// Handler for the "Start" button
	const handleStartChat = () => {
		setShowStartModal(false); // Hide modal
		initEngine(); // Start the heavy lifting
	};

	const handleSend = async (): Promise<void> => {
		if (!input.trim() || isLoading || !isModelLoaded) return;

		const userQuestion = input;
		setInput("");
		setIsLoading(true);

		// Add user message to state
		const newHistory: ChatMessage[] = [...messages, { role: "user", content: userQuestion }];
		setMessages(newHistory);

		try {
			// Fetch context from backend
			const response = await fetch(BACKEND_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: userQuestion }),
			});
			const data: any = await response.json();
			const context: string = Array.isArray(data.context) ? data.context.join("\n\n") : String(data.context || "");

			// Construct the RAG prompt
			const sysPrompt = `You are a helpful assistant for Ethan's portfolio. 
			Use ONLY the following context to answer the user's question. 
			If the answer is not in the context, say you don't know.
				
			Context:
			${context}`

			// Stream response from local LLM
			const chunks: AsyncIterable<any> = await engine.chat.completions.create({
				messages: [
					{ role: "system", content: sysPrompt },
					...newHistory.map(m => ({ role: m.role, content: m.content}))
				],
				temperature: 0.5,
				stream: true
			});

			// Process streamed chunks
			let fullReply = "";
			setMessages(prev => [...prev, { role: "assistant", content: "" }]);

			for await (const chunk of chunks as AsyncIterable<any>) {
				const delta: string = chunk?.choices?.[0]?.delta?.content || "";
				fullReply += delta;

				// Update the last message with new chunk
				setMessages((prev: ChatMessage[]) => {
					const updated = [...prev];
					updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullReply };
					return updated;
				});
			}
		} catch (err) {
			console.error(err);
			setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
		} finally {
			setIsLoading(false);
		}
	};

return (
    <div className={styles.chatContainer} style={{ position: 'relative' }}>
	  {showStartModal && (
		<div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <span className={styles.warningIcon}>🤖</span>
            <h3>Load AI Assistant?</h3>
            <p className={styles.warningText}>
              This feature runs a real AI model directly in your browser.
              <br/>
              <strong>Requires ~4GB download (one-time) and a dedicated GPU.</strong>
            </p>
            <button className={styles.primaryButton} onClick={handleStartChat}>
              Download & Start
            </button>
          </div>
        </div>
	  )}

      {/* Loading Bar for Model Download */}
      {!showStartModal && !isModelLoaded && (
        <div className={styles.loader}>
          <p>⚡ Loading AI Model (approx 4GB - one time only)...</p>
          <small>{downloadProgress}</small>
        </div>
      )}

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className={styles.message}>Thinking...</div>}
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isModelLoaded ? "Ask about my projects..." : "Waiting for model..."}
          disabled={!isModelLoaded || isLoading}
        />
        <button 
          className={styles.button} 
          onClick={handleSend}
          disabled={!isModelLoaded || isLoading}>Send</button>
      </div>
    </div>
  );
};

export default PortfolioChat;
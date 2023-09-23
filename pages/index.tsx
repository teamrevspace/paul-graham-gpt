'use-client'

import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import OpenAI from 'openai';
import { Fragment, useState, useEffect, useRef } from 'react'
import axios from 'axios';
import { AIChatBlock } from '../components/AIChatBlock';
import { UserChatBlock } from '../components/UserChatBlock';
import { SendIcon } from '../components/SendIcon';
import { Status, History } from '../types';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

// openai api
const openai = new OpenAI({
  apiKey: process.env['NEXT_PUBLIC_OPENAI_API_KEY'],
  dangerouslyAllowBrowser: true, // not recommended! best practice is to call api on backend server
});

const SYSTEM_PROMPT = "You are Paul Graham, also known as PG, the co-founder of Y Combinator. Use his analytical insights, calm demeanor, and deep startup wisdom to answer questions. Keep the answers casual and under 3 sentences, and include pauses like 'umm' between sentences.";

const INTRO_MESSAGE = `Hi, I'm Paul Graham, co-founder of Y Combinator, the startup accelerator. You can call me PG. I'm here to help guide and share what I've learned. Ask me anything!` // this is not used in the prompt - only for ux purpose

// eleven labs api
const ELEVEN_LABS_API_KEY = process.env['NEXT_PUBLIC_ELEVEN_LABS_API_KEY'];
const ELEVEN_LABS_VOICE_ID = process.env['NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID'];

// page setup
const PAGE_TITLE = "PaulGrahamGPT";
const PAGE_LABEL = "Based";
const VOICE_ENABLED = true;

const Home: NextPage = () => {
  const [message, setMessage] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [history, setHistory] = useState<Array<History>>([]);
  const [index, setIndex] = useState<number>(1);
  const [status, setStatus] = useState<Status>('idle');

  const generateAudio = async (text: string) => {
    const data = await textToSpeech(text)
    const blob = new Blob([data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = 1; // manual playback speed adjustment 0-1
    audio.play();
  };

  const textToSpeech = async (text: string) => {
    const speechDetails = await axios.request({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`,
      headers: {
        accept: 'audio/mpeg',
        'content-type': 'application/json',
        'xi-api-key': `${ELEVEN_LABS_API_KEY}`,
      },
      data: {
        text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
          "stability": 0.5,
          "similarity_boost": 0.65,
          "style": 0.3,
          "use_speaker_boost": true
        }
      },
      responseType: 'arraybuffer'
    });

    return speechDetails.data;
  };

  const generateChat = async (userInput: string, history: Array<History>) => {
    const newIndex = index + 1;
    setMessage('')
    setStatus('responding')
    setHistory((prev) => [...prev, {
      id: newIndex,
      message: userInput,
    }])

    const messageChain = [{ "role": "system", "content": SYSTEM_PROMPT }] as Array<ChatCompletionMessageParam>

    history.forEach(data => {
      if (data.message && data.response) {
        messageChain.push(
          { "role": "user", "content": data.message },
          { "role": "assistant", "content": data.response }
        );
      }
    });

    messageChain.push({ "role": "user", "content": userInput })

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messageChain,
      stream: true,
      temperature: 0.8,
    });

    let fullChunk = '';

    for await (const part of stream) {
      const chunk = part.choices[0].delta;
      if (chunk && chunk.content) {
        fullChunk = fullChunk + chunk.content;
        setResponse((prev) => prev + chunk.content);
      }
    }
    setHistory([...history, {
      id: newIndex,
      message: userInput,
      response: fullChunk,
    }])
    setResponse('')
    setIndex(newIndex)
    if (VOICE_ENABLED) {
      generateAudio(fullChunk).then(() => {
        setStatus('idle')
      })
    } else {
      setStatus('idle')
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Head>
        <title>{PAGE_TITLE}</title>
        <link rel="icon" href="/favicon.jpg" />
      </Head>

      <nav className="flex z-50 sticky top-0 h-16 w-full items-center justify-end">
        <a
          className="absolute right-4 flex items-center justify-center hover:scale-125 transition-all opacity-50 hover:opacity-100"
          href="https://rev.school/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/rev.png" alt="rev logo" width={32} height={32} />
        </a>
      </nav>

      <main className="flex w-full h-full flex-1 flex-col items-center -mt-16">
        {/** main chat area */}
        <div className="flex flex-col flex-grow w-full h-full overflow-y-auto pb-24 z-10">
          {/** header */}
          <div className="flex flex-col align-center w-full flex-col justify-center self-center px-2 py-4">
            <h1 className="text-4xl font-semibold text-center text-space-gray ml-auto mr-auto my-4 flex gap-2 items-center justify-center">{PAGE_TITLE}<span className="bg-hype-purple text-white py-0.5 px-1.5 text-xs md:text-sm rounded-md uppercase">{PAGE_LABEL}</span></h1>
          </div>
          {/** system prompt */}
          <AIChatBlock message={INTRO_MESSAGE} />
          {/** chat history */}
          {history.length > 0 && history.map((chatblock) => (
            <Fragment key={chatblock.id}>
              {chatblock.message && <UserChatBlock message={chatblock.message} />}
              {chatblock.response && <AIChatBlock message={chatblock.response} />}
            </Fragment>
          ))}
          {/** user input */}
          {message && status === 'responding' && <UserChatBlock message={message} />}
          {/** chatbot response */}
          {response && status === 'responding' && <AIChatBlock message={response} />}
        </div>
        {/** input box */}
        <div className="sticky bottom-0 h-24 w-screen flex items-center justify-center">
          <div className="flex flex-row w-full max-w-[720px] px-6 space-x-4">
            <input type="text" className="appearance-none shadow rounded-lg ring-1 ring-silver leading-5 border border-transparent px-4 py-3 placeholder:text-space-gray block w-full text-black focus:outline-none bg-white disabled:bg-silver" disabled={status === 'responding'} placeholder={status === 'responding' ? 'pg is talking...' : "send a message"} name="chat-input" onChange={(e) => setMessage(e.target.value)} value={message} onKeyDown={(e) => { if (e.key == 'Enter') { generateChat(message, history) } }} />
            <button className={`w-12 h-12 flex items-center justify-center rounded-lg ${!message || status === 'responding' ? 'bg-silver' : 'bg-hype-purple'}`} disabled={!message || status === 'responding'} onClick={(e) => { e.preventDefault(); generateChat(message, history) }}>
              <SendIcon fill={!message ? '#cecece' : '#ffffff'} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home

'use-client'

import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import OpenAI from 'openai';
import { SVGProps, Fragment, useState, useEffect, useRef } from 'react'
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env['NEXT_PUBLIC_OPENAI_API_KEY'],
  dangerouslyAllowBrowser: true,
});

export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);


interface History {
  id: number;
  message?: string;
  response?: string;
}

type Status = 'idle' | 'responding';

const Send = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 -960 960 960"
    {...props}
  >
    <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
  </svg>
)

const PlayArrow = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 -960 960 960"
    {...props}
  >
    <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
  </svg>
)

const UserChatBlock = ({ message }: { message: string }) => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex flex-row w-full max-w-[720px] items-start justify-center space-x-4 px-6 py-4">
        <Image className="block rounded-sm" src="/user.png" alt="user logo" width={48} height={48} priority={true} />
        <p className="w-full text-void-purple">{message}</p>
      </div>
    </div>
  )
}

const PGChatBlock = ({ message }: { message: string }) => {
  return (
    <div className="flex w-full bg-[#f0f0f0] border-t border-b border-silver justify-center">
      <div className="flex flex-row w-full max-w-[720px] items-start justify-center space-x-4 px-6 py-4">
        <div className="flex flex-col h-full items-center">
          <Image className="block rounded-sm" src="/favicon.jpeg" alt="paul graham logo" width={48} height={48} priority={true} />
        </div>
        <p className="w-full text-void-purple">{message}</p>
      </div>
    </div>
  )
}

const Home: NextPage = () => {
  const [message, setMessage] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [history, setHistory] = useState<Array<History>>([]);
  const [index, setIndex] = useState<number>(1);
  const [status, setStatus] = useState<Status>('idle');
  const [audioURL, setAudioURL] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement>(null);

  audioRef.current?.addEventListener('ended', () => {
    setAudioURL('')
  })

  const generateAudio = async (text: string) => {
    const data = await textToSpeech(text)
    const blob = new Blob([data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    setAudioURL(url);
    audioRef.current?.play();
  };

  const textToSpeech = async (text: string) => {
    const API_KEY = process.env['NEXT_PUBLIC_ELEVEN_LABS_API_KEY'];
    const VOICE_ID = 'NeIi2rScGDcLanIYNRH4'; // paul graham voice id

    const speechDetails = await axios.request({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      headers: {
        accept: 'audio/mpeg',
        'content-type': 'application/json',
        'xi-api-key': `${API_KEY}`,
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

  const generateChat = async (userInput: string) => {
    // TODO: store the message in database
    const newIndex = index + 1;
    setMessage('')
    setStatus('responding')
    setHistory((prev) => [...prev, {
      id: newIndex,
      message: userInput,
    }])

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ "role": "system", "content": "You are Paul Graham, also known as PG, the co-founder of Y Combinator. Use his analytical insights, calm demeanor, and deep startup wisdom to answer questions. Keep the answers short and casual, and include pauses like 'umm' between sentences." },
      { "role": "user", "content": userInput }],
      stream: true,
      temperature: 0.7,
    });

    let fullChunk = '';

    for await (const part of stream) {
      const chunk = part.choices[0].delta;
      if (chunk && chunk.content) {
        fullChunk = fullChunk + chunk.content;
        setResponse((prev) => prev + chunk.content);
      }
    }
    // TODO: store the response in database
    setResponse('')
    setStatus('idle')
    await generateAudio(fullChunk)
    setHistory([...history, {
      id: newIndex,
      message: userInput,
      response: fullChunk,
    }])
    setIndex(newIndex)
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Head>
        <title>PaulGrahamGPT</title>
        <link rel="icon" href="/favicon.jpeg" />
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
        <form className="absolute top-0 bottom-0" onSubmit={() => generateChat(message)}>
          {/** main chat area */}
          <div className="flex flex-col flex-grow w-full h-full overflow-y-auto pb-24 z-10">
            {/** header */}
            <div className="flex flex-col align-center w-full flex-col justify-center self-center px-2 py-4">
              <h1 className="text-4xl font-semibold text-center text-space-gray ml-auto mr-auto my-4 flex gap-2 items-center justify-center">PaulGrahamGPT<span className="bg-hype-purple text-white py-0.5 px-1.5 text-xs md:text-sm rounded-md uppercase">Based</span></h1>
            </div>
            {/** system prompt */}
            <PGChatBlock message={`Hi, I'm Paul Graham, co-founder of Y Combinator, the startup accelerator. You can call me PG. I'm here to help guide and share what I've learned. Ask me anything!`} />
            {/** chat history */}
            {history.length > 0 && history.map((chatblock) => (
              <Fragment key={chatblock.id}>
                {chatblock.message && <UserChatBlock message={chatblock.message} />}
                {chatblock.response && <PGChatBlock message={chatblock.response} />}
              </Fragment>
            ))}
            {/** user input */}
            {message && status === 'responding' && <UserChatBlock message={message} />}
            {/** chatbot response */}
            {response && status === 'responding' && <PGChatBlock message={response} />}
            <audio ref={audioRef} controls>
              <source src={audioURL} type="audio/mpeg" />
            </audio>
          </div>
          {/** input box */}
          <div className="sticky bottom-0 h-24 w-screen flex items-center justify-center">
            <div className="flex flex-row w-full max-w-[720px] px-6 space-x-4">
              <input type="text" className="appearance-none shadow rounded-lg ring-1 ring-silver leading-5 border border-transparent px-4 py-3 placeholder:text-space-gray block w-full text-black focus:outline-none bg-white" placeholder="send a message" name="chat-input" onChange={(e) => setMessage(e.target.value)} value={message} />
              <button className={`w-12 h-12 flex items-center justify-center rounded-lg ${!message || status === 'responding' ? 'bg-silver' : 'bg-hype-purple'}`} disabled={!message || status === 'responding'} onClick={(e) => { e.preventDefault(); generateChat(message) }}>
                <Send fill={!message ? '#cecece' : '#ffffff'} />
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Home

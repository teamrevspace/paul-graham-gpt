import Image from 'next/image'

export const AIChatBlock = ({ message }: { message: string }) => {
  return (
    <div className="flex w-full bg-[#f0f0f0] border-t border-b border-silver justify-center">
      <div className="flex flex-row w-full max-w-[720px] items-start justify-center space-x-4 px-6 py-4">
        <div className="flex flex-col h-full items-center">
          <Image className="block rounded-sm" src="/favicon.jpg" alt="chatbot logo" width={48} height={48} priority={true} />
        </div>
        <p className="w-full text-void-purple">{message}</p>
      </div>
    </div>
  )
}

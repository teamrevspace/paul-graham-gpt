import Image from 'next/image'

export const UserChatBlock = ({ message }: { message: string }) => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex flex-row w-full max-w-[720px] items-start justify-center space-x-4 px-6 py-4">
        <Image className="block rounded-sm" src="/user.png" alt="user logo" width={48} height={48} priority={true} />
        <p className="w-full text-void-purple">{message}</p>
      </div>
    </div>
  )
}

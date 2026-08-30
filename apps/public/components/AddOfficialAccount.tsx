const ADD_FRIEND_BUTTON_SRC =
  'https://scdn.line-apps.com/n/line_add_friends/btn/ja.png';

type AddOfficialAccountProps = {
  addFriendUrl: string;
  alreadyFriend?: boolean;
};

export function AddOfficialAccount({
  addFriendUrl,
  alreadyFriend = false,
}: AddOfficialAccountProps) {
  if (alreadyFriend) {
    return (
      <p className="mb-8 text-sm text-slate-600">
        公式 LINE の友だち追加は完了しています。選考のご連絡をお送りします。
      </p>
    );
  }

  return (
    <div className="mb-8">
      <p className="mb-4 text-slate-600">
        選考のご連絡を受け取るには、公式 LINE の友だち追加が必要です。
      </p>
      {addFriendUrl ? (
        <a
          href={addFriendUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src={ADD_FRIEND_BUTTON_SRC}
            alt="友だち追加"
            height={40}
            className="mx-auto h-10"
          />
        </a>
      ) : (
        <p className="text-sm text-slate-500">
          公式アカウントの友だち追加用 URL が未設定です。運営からの案内に従って追加してください。
        </p>
      )}
    </div>
  );
}

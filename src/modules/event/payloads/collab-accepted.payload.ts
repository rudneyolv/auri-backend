export interface CollabAcceptedPayload {
  conversation_id: string;
  from_user: {
    user_id: string;
    name: string;
    profile_picture_url: string | null;
  };
}

export interface EmailQuery {
  sender?: string;
  is?: string;
  labelIds?: any;
  to?: any;
  from?: any;
  _id?: any;
  category?: any;
  subject?: any;
  filename?: any;
  text?: any;
  $or?: any[];
}

export interface Label {
  id: string;
  type: string;
  name: string;
  unreadCount: number | string;
  color?: string;
}

export interface Attachment {
  cid: any;
  filename: string;
  content: string;
  mimeType: string;
}

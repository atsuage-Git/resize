import { PresetSize } from '../types';

export const PRESET_SIZES: PresetSize[] = [
  {
    label: '50 KB',
    sizeKB: 50,
    category: 'web',
    description: 'サムネイル / アプリアイコン / 超軽量',
    icon: 'Zap',
  },
  {
    label: '100 KB',
    sizeKB: 100,
    category: 'web',
    description: 'Webバナー / プロフィール / 証明写真',
    icon: 'Image',
  },
  {
    label: '200 KB',
    sizeKB: 200,
    category: 'web',
    description: 'ブログ記事 / スマホWeb表示の推奨値',
    icon: 'Globe',
  },
  {
    label: '500 KB',
    sizeKB: 500,
    category: 'doc',
    description: '各種Webフォーム提出 / 申請書添付',
    icon: 'FileText',
  },
  {
    label: '1 MB',
    sizeKB: 1024,
    category: 'doc',
    description: 'メール添付 / チャット共有の標準',
    icon: 'Mail',
  },
  {
    label: '2 MB',
    sizeKB: 2048,
    category: 'sns',
    description: 'Twitter(X) / Instagram 高画質投稿',
    icon: 'Share2',
  },
  {
    label: '5 MB',
    sizeKB: 5120,
    category: 'sns',
    description: '各種SNS上限 / LINE高画質送信',
    icon: 'Send',
  },
  {
    label: '8 MB',
    sizeKB: 8192,
    category: 'sns',
    description: 'Discord無料枠上限（8MB以内）',
    icon: 'MessageSquare',
  },
  {
    label: '10 MB',
    sizeKB: 10240,
    category: 'sns',
    description: 'Discord Nitro Basic / 10MB制限',
    icon: 'Flame',
  },
  {
    label: '25 MB',
    sizeKB: 25600,
    category: 'doc',
    description: 'Gmail / Outlook 添付ファイル上限',
    icon: 'Paperclip',
  },
];

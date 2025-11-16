import React, { memo } from 'react';

// Common props for icons
type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

const encodeSvg = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const logoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAEAAQADAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//2Q==";

const sameelAvatarBase64 = encodeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1a1a1a"/><path fill="#00f5d4" d="M43.67 22.43c-1.48-1.48-3.44-2.23-5.88-2.23s-4.4.75-5.88 2.23c-.79.8-1.38 1.78-1.78 2.93a10.25 10.25 0 0 0-.59 3.88c0 1.52.3 2.94.9 3.88s1.48 1.88 2.64 2.36a9.52 9.52 0 0 0 3.71 1.12c3.2 0 5.9-.8 7.93-2.36a6.68 6.68 0 0 0 2.36-5.27c0-1.54-.31-2.98-.93-4.32-.57-1.24-1.34-2.26-2.3-3.07Zm-6.76 11.5c-1.92 0-3.46-.58-4.62-1.75s-1.75-2.69-1.75-4.57c0-1.24.27-2.37.8-3.37a4.85 4.85 0 0 1 2.16-1.69c3.17-1.02 5.39-.18 6.65 2.48a4.37 4.37 0 0 1 .65 3.04c0 1.98-.6 3.59-1.8 4.84-1.2 1.25-2.79 1.87-4.78 1.87Z"/></svg>');

const shouryaAvatarBase64 = encodeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1a1a1a"/><path fill="#ff00ff" d="M43.67 22.43c-1.48-1.48-3.44-2.23-5.88-2.23s-4.4.75-5.88 2.23c-.79.8-1.38 1.78-1.78 2.93a10.25 10.25 0 0 0-.59 3.88c0 1.52.3 2.94.9 3.88s1.48 1.88 2.64 2.36a9.52 9.52 0 0 0 3.71 1.12c3.2 0 5.9-.8 7.93-2.36a6.68 6.68 0 0 0 2.36-5.27c0-1.54-.31-2.98-.93-4.32-.57-1.24-1.34-2.6-2.3-3.44Zm-6.76 11.5c-1.92 0-3.46-.58-4.62-1.75s-1.75-2.69-1.75-4.57c0-1.24.27-2.37.8-3.37a4.85 4.85 0 0 1 2.16-1.69c3.17-1.02 5.39-.18 6.65 2.48a4.37 4.37 0 0 1 .65 3.04c0 1.98-.6 3.59-1.8 4.84-1.2 1.25-2.79 1.87-4.78 1.87Z"/></svg>');

const varunAvatarBase64 = encodeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1a1a1a"/><path fill="#facd15" d="M27 22l5 20 5-20h-2.5L32 35l-2.5-13H27Z"/></svg>');

export const LogoIcon = memo(({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={logoBase64} alt="AeroSpotter AI Logo" className={`w-10 h-10 rounded-full object-cover ${className || ''}`} {...props} />
));

export const SameelAvatar = memo(({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={sameelAvatarBase64} alt="Aero Sameel" className={`w-6 h-6 rounded-full object-cover ${className || ''}`} {...props} />
));

export const ShouryaAvatar = memo(({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={shouryaAvatarBase64} alt="Aero Shourya" className={`w-6 h-6 rounded-full object-cover ${className || ''}`} {...props} />
));

export const VarunAvatar = memo(({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={varunAvatarBase64} alt="Aero Varun" className={`w-6 h-6 rounded-full object-cover ${className || ''}`} {...props} />
));

export const UploadIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg className={`w-12 h-12 text-gray-500 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12l-4-4m4 4l4-4m-4 4V4" />
    </svg>
));

export const CameraIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-12 h-12 text-gray-500 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
));

export const SendIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
));

export const UserIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
));

export const ChiefIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 10a4 4 0 11-8 0 4 4 0 018 0zm-4 8v-2m0-10V4M6 18H4v-2m16 2h-2v-2M6 6H4v2m16-2h-2V4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
    </svg>
));

export const AeroIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8V4m0 16v-4m4-8h4M4 12H0m19.778-4.222l-2.828-2.828M4.222 19.778l-2.828-2.828m18.384 0l-2.828 2.828M4.222 4.222l-2.828 2.828" />
    </svg>
));

export const NumbersIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h6m2 4h-1a1 1 0 01-1-1V5a1 1 0 011-1h1m-3 0a1 1 0 00-1-1H8a1 1 0 00-1 1v14a1 1 0 001 1h1m3-15a1 1 0 011-1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 01-1-1V5z" />
    </svg>
));

export const PrototypeIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6l-3.5 3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 10l-3.5 3.5" />
    </svg>
));

export const AudioIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
));

export const PauseIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
));

export const LinkIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
));

export const DownloadIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg className={`w-4 h-4 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
));

export const ImageIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg className={`w-16 h-16 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
));

export const WireframeCarIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={`w-24 h-24 ${className || ''}`} fill="none" stroke="currentColor" strokeWidth="1" {...props}>
    {title && <title>{title}</title>}
    <path d="M14.5 35.5l-8-8 8-8" />
    <path d="M50.5 20.5l-10-5h-20l-10 5 10 5h20z" />
    <path d="M20.5 15.5v24" />
    <path d="M40.5 15.5v24" />
    <path d="M10.5 39.5h44" />
    <path d="M6.5 27.5h52" />
    <path d="M50.5 44.5l-10-5h-20l-10 5 10 5h20z" />
    <path d="M20.5 39.5l-14-12" />
    <path d="M40.5 39.5l14-12" />
  </svg>
));

export const LightbulbIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg className={`w-16 h-16 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
));

export const LoadingIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg className={`animate-spin h-10 w-10 text-f1-accent-cyan ${className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        {title && <title>{title}</title>}
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
));

export const ErrorIcon = memo(({ className, title, ...props }: IconProps) => (
    <svg className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
));

export const WarningIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.001-1.742 3.001H4.42c-1.522 0-2.492-1.667-1.742-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
));

export const ChatBubbleIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
));

export const MicrophoneIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
));

export const MicrophoneOffIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.586 15.586a7 7 0 01-9.172-9.172M19 11a7 7 0 00-7-7m0 0a7 7 0 00-7 7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM3 3l18 18" />
  </svg>
));

export const XCircleIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
));

export const ChevronIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
));

export const InfoIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
));

export const ZoomInIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
));

export const ZoomOutIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
  </svg>
));

export const FitToScreenIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
  </svg>
));

export const TerminalIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
));

export const ResetIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 9a9 9 0 0114.65-1.65" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 15a9 9 0 01-14.65 1.65" />
  </svg>
));

export const SunIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a5 5 0 100-10 5 5 0 000 10z" />
  </svg>
));

export const MoonIcon = memo(({ className, title, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
));
export const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
export const WA_HELLO = '¡Hola Delfi! Vi tu web y quería consultarte por un maquillaje.';
export const openChat = () => window.dispatchEvent(new Event('open-chat'));

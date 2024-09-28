export const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
};

document.addEventListener('DOMContentLoaded', () => {
    const countdownTitleEl = document.getElementById('countdown-title') as HTMLHeadingElement;
    const countdownTimerEl = document.getElementById('countdown-timer') as HTMLDivElement;

    const params = new URLSearchParams(window.location.search);
    const zielzeitInMinuten = parseInt(params.get('zielzeit') || '0', 10);
    const titel = params.get('titel') || 'Restzeit';

    if (countdownTitleEl) {
        countdownTitleEl.textContent = titel;
    }

    const countdownInterval = window.setInterval(() => {
        const jetzt = new Date();
        const jetztInSekunden = (jetzt.getHours() * 3600) + (jetzt.getMinutes() * 60) + jetzt.getSeconds();
        const zielInSekunden = zielzeitInMinuten * 60;
        const restSekunden = zielInSekunden - jetztInSekunden;

        if (restSekunden <= 0) {
            clearInterval(countdownInterval);
            countdownTimerEl.textContent = "00:00:00";
            countdownTimerEl.style.color = 'var(--success-color)';
            return;
        }

        countdownTimerEl.style.color = 'var(--primary-color)';
        const stunden = Math.floor(restSekunden / 3600);
        const minuten = Math.floor((restSekunden % 3600) / 60);
        const sekunden = restSekunden % 60;

        countdownTimerEl.textContent =
            `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
    }, 1000);
});
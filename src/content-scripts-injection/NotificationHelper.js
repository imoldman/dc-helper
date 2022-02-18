export default class NotificationHelper {
    static async notify(title, body, clickToUrl) {
        await Notification.requestPermission();
        let notification = new Notification(title, {
            body: body
        });
        notification.onclick = (e) => {
            e.preventDefault();
            window.open(clickToUrl, '_blank');
        };
    }
}
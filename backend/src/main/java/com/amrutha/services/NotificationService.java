package com.amrutha.services;

import com.amrutha.models.Notification;
import com.amrutha.models.User;
import com.amrutha.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(User user, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(User user) {
        if ("ROLE_ADMIN".equals(user.getRole()) || "ROLE_SUPER_ADMIN".equals(user.getRole())) {
            // Admins see admin/public notifications plus their own
            return notificationRepository.findByUserOrUserIsNullOrderByCreatedAtDesc(user);
        }
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> notifications;
        if ("ROLE_ADMIN".equals(user.getRole()) || "ROLE_SUPER_ADMIN".equals(user.getRole())) {
            notifications = notificationRepository.findByUserOrUserIsNullOrderByCreatedAtDesc(user);
        } else {
            notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        }
        for (Notification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }
}

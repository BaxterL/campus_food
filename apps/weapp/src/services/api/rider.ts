import { http } from '@/services/http';
import type { RiderDuty, RiderTask } from '@/services/api/types';

export const riderApi = {
  getDuty() {
    return http.get<RiderDuty>('/rider/duty');
  },

  startDuty() {
    return http.post<RiderDuty>('/rider/duty/on');
  },

  endDuty() {
    return http.post<RiderDuty>('/rider/duty/off');
  },

  listTasks() {
    return http.get<RiderTask[]>('/rider/tasks');
  },

  getTask(taskId: string) {
    return http.get<RiderTask>(`/rider/tasks/${taskId}`);
  },

  acceptTask(taskId: string) {
    return http.post<RiderTask>(`/rider/tasks/${taskId}/accept`);
  },

  arriveStore(taskId: string) {
    return http.post<RiderTask>(`/rider/tasks/${taskId}/arrive-store`);
  },

  confirmPickup(taskId: string, pickupCode: string) {
    return http.post<RiderTask>(`/rider/tasks/${taskId}/pickup`, { pickupCode });
  },

  confirmDelivery(taskId: string, deliveryCode: string) {
    return http.post<RiderTask>(`/rider/tasks/${taskId}/deliver`, { deliveryCode });
  },
};

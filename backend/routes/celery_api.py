"""
routes/celery_api.py
Admin-only endpoints to manually trigger and monitor Celery tasks.
"""
from flask_jwt_extended import get_jwt, jwt_required
from flask_restful import Resource


def _admin_only():
    return get_jwt().get('role') == 'admin'


class TriggerDailyReminders(Resource):
    """POST /api/admin/tasks/reminders"""
    @jwt_required()
    def post(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        try:
            from tasks.scheduled_tasks import send_daily_deadline_reminders
            result = send_daily_deadline_reminders.delay()
            return {'message': 'Daily reminders task dispatched', 'task_id': result.id}, 202
        except Exception as e:
            return {'error': str(e)}, 500


class TriggerMonthlyReport(Resource):
    """POST /api/admin/tasks/monthly-report"""
    @jwt_required()
    def post(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        try:
            from tasks.scheduled_tasks import send_monthly_admin_report
            result = send_monthly_admin_report.delay()
            return {'message': 'Monthly report task dispatched', 'task_id': result.id}, 202
        except Exception as e:
            return {'error': str(e)}, 500


class TaskStatus(Resource):
    """GET /api/admin/tasks/status/<task_id>"""
    @jwt_required()
    def get(self, task_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        try:
            from celery_app import celery
            result = celery.AsyncResult(task_id)
            response = {'task_id': task_id, 'status': result.status}
            if result.status == 'SUCCESS':
                response['result'] = result.result
            elif result.status == 'FAILURE':
                response['error'] = str(result.result)
            return response, 200
        except Exception as e:
            return {'error': str(e)}, 500


class ClearCache(Resource):
    """POST /api/admin/cache/clear"""
    @jwt_required()
    def post(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        try:
            from extensions import cache
            cache.clear()
            return {'message': 'Cache cleared successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

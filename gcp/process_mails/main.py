from datetime import datetime

from batch_last_30 import batch_last_30_days
from retrieve_email_by_labels import retrieve_email_by_labels

def health_check(request):
    if request.method == 'GET' and request.args.get('health') == 'check':
        return {
            "status": "healthy",
            "function": "batch_last_30_days",
            "timestamp": datetime.now() 
        }, 200
    else: 
        return False

def last_30_days(request):
    health_check_result = health_check(request)
    
    if health_check_result != False:
        return health_check_result
    else:
        return batch_last_30_days(request)

def retrieve_email_by_labels_entry_point(request):
    health_check_result = health_check(request)
    
    if health_check_result != False:
        return health_check_result
    else:
        return retrieve_email_by_labels(request)
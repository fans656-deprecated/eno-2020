import json
import asyncio


class Transfer:

    queues = []

    @staticmethod
    async def stream(request):
        queue = asyncio.Queue()
        Transfer.queues.append(queue)
        while True:
            if await request.is_disconnected():
                Transfer.queues.remove(queue)
                break
            data = await queue.get()
            yield f'event: progress\n'
            yield f'data: {json.dumps(data)}\n\n'

    def __init__(self, transfer_id, n_bytes_total):
        self.transfer_id = transfer_id
        self.n_bytes_total = n_bytes_total
        self.n_bytes_received = 0
        self.count = 0

    async def receive(self, chunk):
        self.n_bytes_received += len(chunk)
        self.count += 1
        data = {
            'id': self.transfer_id,
            'n_bytes_total': self.n_bytes_total,
            'n_bytes_received': self.n_bytes_received,
            'count': self.count,
        }
        print('receive', data)
        for queue in self.queues:
            await queue.put(data)

<?php
$tokenData = [
    'Amount' => '10000',
    'OrderId' => 'pay_3',
    'Password' => 'test_password',
    'PaymentId' => 'test_payment_1',
    'Status' => 'CONFIRMED',
    'TerminalKey' => 'Test',
];
ksort($tokenData);
echo hash('sha256', implode('', $tokenData));

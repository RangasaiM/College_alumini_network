import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
};

export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(error: unknown, status: number = 400): NextResponse<ApiResponse> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation error',
        errors: error.errors,
      },
      { status }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 401 }
  );
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 403 }
  );
}

export function notFoundResponse(message: string = 'Not found'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 404 }
  );
} 
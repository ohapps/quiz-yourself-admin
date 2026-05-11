import { NextResponse } from 'next/server';
import { getContentVersion } from '@/lib/data/app-state';
import { getCategoriesWithQuestions } from '@/lib/data/categories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const versionParam = searchParams.get('version');

    const currentVersion = await getContentVersion();

    // If the mobile app sent a version and it matches the current version,
    // we can let them know they are up to date without sending all the data again.
    if (versionParam && parseInt(versionParam, 10) === currentVersion) {
      return NextResponse.json({
        upToDate: true,
        version: currentVersion,
      });
    }

    const categories = await getCategoriesWithQuestions();

    return NextResponse.json({
      upToDate: false,
      version: currentVersion,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
